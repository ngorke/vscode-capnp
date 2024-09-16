const vscode = require("vscode");
const crypto = require("crypto");
const { spawn } = require("child_process");

/**
 * @type {{ readonly CAPNP_TOOL_PATH: string, readonly IMPORT_PATH: string[], readonly STANDARD_IMPORT: string}}
 */
const CFG = Object.defineProperties({}, {
	CAPNP_TOOL_PATH: {
		get: () => vscode.workspace.getConfiguration("capnp").get("tool.path"),
	},
	IMPORT_PATH: {
		get: () => vscode.workspace.getConfiguration("capnp").get("importPath"),
	},
	STANDARD_IMPORT: {
		get: () => vscode.workspace.getConfiguration("capnp").get("standardImport"),
	}
});

/**
 * Activate the extension.
 * @param {vscode.ExtensionContext} context 
 */
function activate(context) {
	const generateUidCmd = vscode.commands.registerCommand("capnp.generateUid", generateUid);

	initCapnp(context)
		.catch(err => {
			console.error(`Unable to initialize capnp: ${err}`);
			throw err;
		});

	context.subscriptions.push(generateUidCmd);
}

/**
 * 
 * @param  {...string} args 
 * @returns {Promise<{error: import("child_process").ExecException | null, code: number | null, stdout: string, stderr: string}>}
 */
async function capnpExec(...args) {
	return new Promise((res, rej) => {
		let stdout = "";
		let stderr = "";

		const CAPNP_BIN = CFG.CAPNP_TOOL_PATH || "capnp";

		console.log(CAPNP_BIN, ...args);

		const capnp = spawn(CAPNP_BIN, [...args], {
			stdio: ["ignore", "pipe", "pipe"]
		});
		capnp.stdout.on('data', data => {
			stdout += data;
		});
		
		capnp.stderr.on('data', data => {
			stderr += data;
		});

		capnp.on("error", error => res({ code: null, error, stdout, stderr }));
		capnp.on('close', code => res({ code: code, error: null, stdout, stderr }));
	});
}

/**
 * 
 * @returns {Promise<boolean>} Whether or not capnp could be retrieved.
 */
function isCapnpReachable() {
	return capnpExec("--version").then(x => x.code == 0 && x.error == null);
}

/**
 * Activate the extension.
 * @param {vscode.ExtensionContext} context 
 */
async function initCapnp(context) {
	const available = await isCapnpReachable();
	if (!available) {
		console.warn("Capnp tool not found.");
		vscode.window.showWarningMessage(
			"Unable to execute the capnp tool.\n" +
			"Please ensure it is installed and in PATH.\n" +
			"\n" +
			"Code diagnostics will be unavailable."
		);
	}

	const diagnostics = vscode.languages.createDiagnosticCollection("capnp");
	const changeWatcher = vscode.workspace.onDidSaveTextDocument((e) => {
		if (e.fileName.endsWith(".capnp")) {
			capnpDocumentChanged(e.uri, diagnostics);
		}
	})
	vscode.workspace.findFiles("**/*.capnp")
		.then(uris => uris.forEach(x => capnpDocumentChanged(x, diagnostics)));

	context.subscriptions.push(diagnostics);
	context.subscriptions.push(changeWatcher);
}

/**
 * 
 * @param {string} str 
 * @returns {{ 
 * 		file: string, 
 * 		rowStart: number, 
 * 		rowEnd: number, 
 * 		colStart: number, 
 * 		colEnd: number,
 * 		type: string,
 * 		message: string
 * }[]}
 */
function parseCompileErrors(str) {
	// The type of regex that makes you grit your teeth.
	const regex = /\s*((?:\w:(?:\/|\\))?[^:]+):(\d+)(?:-(\d+))?(?::(\d+)(?:-(\d+))?)?:\s*([^:]*):\s*(.*)\s*/g;
	const errors = [];
	for (const match of str.matchAll(regex)) {
		const file = match["1"];
		const rowStart = match["2"] - 1;
		const rowEnd = match["3"] - 1 || rowStart;
		const colStart = match["4"] - 1;
		const colEnd = match["5"] - 1 || colStart;
		const type = match["6"];
		const message = match["7"];
		errors.push({ file, rowStart, rowEnd, colStart, colEnd, type, message });
	}
	return errors;
}

/**
 * 
 * @param {vscode.Uri} uri 
 * @param {vscode.DiagnosticCollection} diagnostics
 */
function capnpDocumentChanged(uri, diagnostics) {
	console.log("File changed - running diagnostics");

	const standardImport = CFG.STANDARD_IMPORT ? [] : ["--no-standard-import"];
	const imports = CFG.IMPORT_PATH.map(x => "-I" + x);

	capnpExec("compile", ...standardImport, ...imports, uri.fsPath, "-o-")
		.then(({code, stderr}) => {
			const compileErrors = code != 0 ? stderr : "";
			const newDiags = parseCompileErrors(compileErrors).map(err =>
				new vscode.Diagnostic(
					new vscode.Range(err.rowStart, err.colStart, err.rowEnd, err.colEnd),
					err.message
				)
			);
			diagnostics.set(uri, newDiags);
		});
}

function generateUid(...args) {
	let uidArray = new Uint32Array(2);
	while ((uidArray[0] & 1 << 31) === 0) {
		crypto.getRandomValues(uidArray);
	}
	const upper = uidArray[0].toString(16);
	const lower = uidArray[1].toString(16).padStart(8, "0");
	const uid = `@0x${upper}${lower}`;
	insertIntoEditor(uid);
}

/**
 * 
 * @param {string} str 
 */
async function insertIntoEditor(str) {
	await vscode.window.activeTextEditor.insertSnippet({
		value: str
	});
}


module.exports = { activate };
