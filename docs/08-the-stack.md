# Lecture 8 — The stack, and why it is written in six languages

**Wed Sep 2, 8:00–8:50, CH 310.** Keyed to the Field Guide, **Part IV — Case
Study**. No new tooling. The Parking App gets *built* after this; today is the
idea it is built to demonstrate.

## The move

You have already met a stack. It just wasn't running.

The last two weeks were `git`, `bash`, GitHub Actions `yml`, `cmake` and
Markdown. **Five languages, not one of them general-purpose, each shaped by
exactly one job.** Nobody assembled that set for elegance — each survived
because it fit a layer, and every attempt to do the neighbouring layer's work
in it went badly. (Ask them: who has written a `bash` script that should have
been a program? Who has written CI logic in `yml` that wanted an `if`?)

**Today's claim: the runtime stack is the same phenomenon, and for the same
reason.** SQL, Node, JSON, JavaScript, HTML, CSS. Six more, same argument.

If that lands, the course's central question is already in the room — the
syllabus calls it *contrast language features for suitability on a given
problem domain* — and they got to it from something they've touched.

## The spine (~35 min)

**Do not go left to right through the stack.** Sort them by *what they
represent*, because that is the property that explains their shape.

| | what it represents | how it computes | paradigm |
|---|---|---|---|
| **JSON** | a value | **not at all** | data, not a language |
| **HTML** | a tree | not at all | declarative markup |
| **CSS** | rules over a tree | matching + cascade | **closest thing you use daily to constraint/logic** |
| **SQL** | sets and relations | you say *what*, the planner picks *how* | declarative, set-at-a-time |
| **JavaScript** | control and state | imperative, single-threaded event loop | imperative + functional + prototype-OO |
| **Node** | JS *given a process* | same language, plus I/O | host, not a language |

Three things worth dwelling on, in order of how much they surprise people:

1. **JSON computes nothing, and that is why it crosses every boundary.** A
   format with no evaluation has no evaluator to disagree about. Contrast with
   sending code across a boundary — which the class has already seen go wrong
   in CI.
2. **CSS is a rule system, not a style file.** Selectors are patterns, the
   cascade is conflict resolution, specificity is the tiebreak. This is the
   syllabus's *logic/constraint* bullet, in a language they've all used and
   none of them thought of that way. It is the best 8am moment in the lecture.
3. **SQL is where you stop saying how.** `SELECT` names a result, not a loop.
   Then show a query plan and ask who wrote the algorithm. Nobody did — the
   planner chose, and it can choose differently tomorrow on the same query.
   That is the strongest declarative/imperative contrast available without
   leaving tools they'll use in the project.

**Node's line is the punchline of the table, not an entry:** it is the *same
language* as the browser's, given a process and I/O. Same syntax, different
capabilities — so "what a language can do" is not a property of the language.
That is the cleanest available example of *host vs language*, and it sets up
the compiler/interpreter section later in the term.

## Close (~10 min): the question to leave open

**Why isn't there one language for all six layers?** People have tried — let
them name attempts before you do.

Do not answer it. It is the course's thesis and it should stay open until they
have built something across the boundaries themselves. Then the parking app
lands as evidence rather than as an exercise.

## Assessment hook

One paragraph, submitted before Friday: **pick one layer of the parking app and
argue that the language used for it is the wrong choice.** They must name what
would be better and what it would cost. Cheap to grade, impossible to fake, and
it forces the contrast the outcome asks for.

## What this lecture deliberately does NOT do

- **No code.** The parking app is next; today is the shape it is built to show.
- **No new tooling.** Standard stack, nothing from any side project.
- **No paradigm taxonomy lecture.** They meet procedural/functional/OO/logic as
  *observations about tools they already use*, which is the order that sticks.
  The formal treatment is Part II of the Field Guide, and it reads better after
  this than before it.
