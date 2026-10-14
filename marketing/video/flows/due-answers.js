// Looks up the answer for the question copied from screen (maestro.copiedText).
// Sets output.ans (text to type) and output.rx (Java regex for the multiple-choice option label).
var MAP = {
 "Who is described as \"the Word\" in John 1?": "Jesus Christ.",
 "What was the first miracle Jesus performed in John?": "Turning water into wine at Cana.",
 "Complete John 3:16: \"For God so loved the world...\"": "\"...that he gave his one and only Son.\"",
 "\"The Lord is my ___\"": "shepherd",
 "\"I shall not ___\"": "want",
 "\"He makes me lie down in green ___\"": "pastures",
 "Romans 3:23 — \"All have sinned and fall short of the ___ of God.\"": "glory",
 "Romans 6:23 — \"The wages of sin is ___.\"": "death",
 "Romans 6:23 — \"...but the gift of God is eternal ___.\"": "life",
 "How many books are in the Bible?": "66.",
 "How many books in the Old Testament?": "39.",
 "How many books in the New Testament?": "27.",
 "Who visited Jesus at night in John 3?": "Nicodemus.",
 "\"I am the ___ of the world\" (John 8:12).": "light",
 "\"He leads me beside quiet ___\"": "waters",
 "\"He refreshes my ___\"": "soul",
 "Romans 5:8 — \"While we were still sinners, ___ died for us.\"": "Christ",
 "Romans 10:9 — believe in your ___ that God raised him.": "heart",
 "What are the first four books of the NT called?": "The Gospels.",
 "Who wrote most of the New Testament letters?": "Paul."
};
var q = (maestro.copiedText || '').trim();
var a = MAP[q];
if (!a) { for (var k in MAP) { if (q.indexOf(k.slice(0, 20)) === 0) { a = MAP[k]; break; } } }
a = a || '';
output.ans = a;
output.rx = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
