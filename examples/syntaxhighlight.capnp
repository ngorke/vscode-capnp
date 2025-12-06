# File for testing syntax highlighting.
@0xd9fc8df30aad60f3;

using Importable = import "importable.capnp";
using ImportedA = import "importable.capnp".A;
using import "importable.capnp".B;

const isTrue :Bool = false;
const pi :Float32 = 0x0;
const answerToAll :Int32 = 42;
const someText :Text = "vscode-capnp";
const structA :StructNoID = (foo = false, bar = "No default for me", );
const structB :StructNoID = (foo = .isTrue, bar = .someText);

annotation bar(interface, struct, enum, file) :Void;
annotation foo(*) :Text;

interface MyInterface @0xbdec316f14977682 {
	# Interface for testing!
	methodA @0 (inp :Bool = true) -> (out :Bool);
	methodB @1 StructID -> (b :Bool);
	methodC @2 (inp :Text = "Default!") -> StructID;
	methodD @3 StructID -> StructID;

	struct InnerStructNoID {}
	struct InnerStructID @0xd1b24e85b63c1e6b {}
	enum InnerEnumNoID {}
	enum InnerEnumID @0xa741877dcf527215 {}
}
interface AnnotatedInterface @0xde994c3567d1f8ea $foo("bar") $bar {}

enum EnumNoID {
	# comment
	foo @0;
	bar @1;
}
enum EnumID @0xdf6e67366118a937 {
	foo @0;
	bar @1;
}
enum AnnotatedEnum $foo("bar") $bar {}

struct StructNoID {
	# comment
	foo @0 :Bool = true;
	bar @1 :Text = "I love default values!";
	baz @6 :UInt32 = 0xC0FFEE;
	union {
		# comment
		yes @2 :Void;
		no @3 :Void;
	}
	yesOrNo :union {
		yes @4 :Void;
		no @5 :Void;
	}
}
struct StructID @0xf38708a52badaad4 {
	foo @0 :Bool;
	bar @1 :Text;

	union {
		# comment
		yes @2 :Void;
		no @3 :Void;
	}
	yesOrNo :union {
		# comment
		yes @4 :Void;
		no @5 :Void;
	}
}
struct AnnotatedStruct $foo("bar") $bar {}
