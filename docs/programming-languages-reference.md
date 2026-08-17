# Programming Languages: A Reference

*Adapted and reorganized from the CSCI 330 course notes (Fall 2024), with new material on large language models as a model of computation — including who owns AI-assisted code — and a running full-stack case study (the "Parking App") added throughout.*

## Preface

The original course notes were captured chronologically, lecture by lecture. This document reorganizes that material by topic, so it can be used as a standing reference rather than a log of what was covered on which day. Two additions were not in the original notes:

1. **Large language models as a model of computation** (§1.4); the argument that reliable systems are still built from traditional, repeatable machines even when a probabilistic model sits at their core (§1.5); and, as a direct consequence, why that repeatability doesn't relieve the engineer who ships the code of the responsibility to actually understand it (§1.6).
2. **A running example, the Parking App** (Chapter 9), a small full-stack system used throughout the document to show how language *types* couple across the layers of a real application, how functional patterns show up inside non-functional languages, and why HTML/CSS and SQL are best understood as logic/constraint languages rather than "just markup" and "just a query language."

---

## Part I — Foundations: Models of Computation

Before comparing programming languages, it is worth comparing the *machines* those languages describe. A programming language is, in the end, a notation for instructing some model of computation — and not every model works the same way.

### 1.1 Classical (Von Neumann) Computation

The dominant model since the 1940s: a CPU, RAM, and a stack, executing a deterministic sequence of instructions.

- Instructions execute one after another (or in parallel across cores, but each core is still sequential).
- Given the same initial state and the same inputs, a Von Neumann machine produces the same output, every time.
- Almost every general-purpose programming language — C, Python, Java, JavaScript, Prolog's host runtime — ultimately compiles or interprets down to this model.

This determinism is not incidental. It is the property that makes debugging, testing, and auditing possible at all: if a program can't be re-run to reproduce a bug, it can't reliably be fixed.

### 1.2 Neural Networks

Neural networks are a different model of computation, layered on top of Von Neumann hardware:

- **Architecture**: interconnected nodes ("neurons") arranged in input, hidden, and output layers.
- **Input nodes** receive raw data; **hidden nodes** transform it via weighted sums and activation functions; **output nodes** produce the result.
- The key shift: the "program" is not written by hand as explicit steps. It is a set of numeric **weights** learned by training on data. A neural network is a function whose behavior is *fit* to examples, not *authored* as a sequence of instructions.
- The evaluation of a trained network (a "forward pass") is still deterministic arithmetic — but the network was produced by an optimization process, not by writing an algorithm.

### 1.3 Probabilistic Computation, Simulation, and State Estimation

**Probabilistic computation** is a model where outcomes are governed by probabilities rather than certainties. A variable might have a 30% chance of taking one value and a 70% chance of another; the "correct" output is a distribution, not a single answer.

- **Branching view**: a probabilistic assignment can be thought of as splitting a computation into multiple parallel "branches," one per outcome, each weighted by its likelihood. Repeated probabilistic choices or loops cause this branching to grow exponentially, which quickly makes *exact* tracking of every outcome intractable.
- **Monte Carlo simulation** sidesteps that explosion: instead of tracking every possible outcome, it draws many random samples and uses their aggregate behavior to estimate the true distribution. This is standard in traffic modeling, weather prediction, and any domain where an exact solution is impractical but a statistically good estimate is enough.
- **Everyday use**: recommendation systems (e.g., a video platform predicting what a user is likely to watch next) are, underneath, probabilistic models estimating a user's latent preferences or state from observed behavior.
- **State estimation is a use case in its own right.** Reasoning about the state of a system you can only partially observe — where a robot actually is, what a noisy sensor is really reporting, what a user's true intent is — is itself a form of probabilistic computation, independent of whether the hardware running it is classical or quantum. Bayesian filters, particle filters, and Kalman filters (the backbone of robotics localization and mapping, and of any system fusing noisy sensor data) all represent a system's state as a probability distribution and update that distribution as new evidence arrives. On ordinary (classical, Von Neumann) hardware, this distribution has to be *simulated* — approximated via sampling (Monte Carlo, particle filters) or via closed-form approximations (Kalman filters) — but the technique is valuable on its own terms, with or without specialized hardware to run it natively.
- **Quantum computing takes the same idea and removes the simulation step.** A classical bit is 0 or 1; a qubit can exist in a **superposition** of both simultaneously. Where the sampling methods above *approximate* a probability distribution by drawing many samples one at a time, a quantum computer can represent and manipulate that distribution directly, in superposition, rather than sampling it repeatedly. Quantum computing doesn't introduce a new kind of question to ask — probabilistic modeling and state estimation are already well-established on classical hardware — it changes whether the answer has to be *simulated* at all, which is why it's expected to have outsized impact on problems that are exponential under classical simulation, such as certain cryptographic and combinatorial search problems.

### 1.4 Large Language Models as a Model of Computation

Large language models (LLMs) deserve to be named as their own model of computation, distinct from — but built on — neural networks and probabilistic computation.

**What makes an LLM a distinct model:**

- **The "program" is the weights, and the weights are not hand-written.** As with neural networks generally, an LLM's behavior is the product of training on data, not of a programmer enumerating cases. What's distinct about LLMs specifically is *what* they're trained to compute: a probability distribution over "the next token, given everything so far," repeated to generate sequences.
- **The interface is a prompt, not source code.** Where a Von Neumann program is invoked with arguments and a Prolog program is invoked with a query, an LLM is invoked with a context (a prompt) and returns a sampled continuation. The same prompt can, by design, produce different outputs on different runs — inference is a **sampling process** over a learned distribution (governed by parameters like temperature and top-p), not a single deterministic evaluation.
- **It generalizes probabilistic computation to language and reasoning tasks.** Where §1.3 covers probabilistic *values* (a variable is 1 with 30% probability) and Monte Carlo covers probabilistic *simulation*, an LLM applies the same underlying idea — model an outcome as a distribution rather than a certainty — to sequences of tokens, and by extension to open-ended tasks like summarization, code generation, and dialogue that classical models of computation have no native way to express.

**Why this matters for language design.** Every model of computation earlier in this chapter eventually needs a notation for humans to direct it — that's what a programming language *is*. LLMs are unusual in that their primary "notation" (natural-language prompting) is deliberately under-specified compared to a grammar-defined programming language (Chapter 7). That looseness is the source of both their flexibility and their central engineering problem, which is the subject of the next section.

### 1.5 Why Reliable Systems Are Still Built From Repeatable Machines

It would be easy to read §1.5 and conclude that programming, or at least an important part of it, has moved from deterministic Von Neumann machines to a fundamentally nondeterministic model. In practice, the opposite discipline holds, and it holds for the same reason it always has: **reliable systems require repeatability.** A system that cannot be reproduced cannot be debugged, cannot be meaningfully tested, cannot be rolled back, and cannot be audited. That requirement predates LLMs — it is the same reason procedural languages are still preferred for flight software (§2.1, §2.5) and the same reason Docker containers exist to make development and deployment environments reproducible (§8.3) — and it does not relax just because a probabilistic model is involved. It sharpens.

Look at where an LLM actually sits inside a real software system, in both directions:

- **The toolchain that *builds* the model is a traditional, repeatable machine.** Data preprocessing, training scripts, hyperparameter configuration, dependency versions, and hardware allocation are ordinary deterministic software, run under version control, in reproducible (often containerized) environments, exactly like any other build pipeline. The fact that the *artifact* produced (the trained weights) behaves probabilistically does not mean the *process that produced it* is allowed to be unreproducible — quite the opposite: without a repeatable training pipeline, a model's behavior can't be regression-tested, its training can't be audited for what data it saw, and a bug in training can't be isolated. The randomness is confined to specific, deliberately controlled points (e.g., seeded initialization, seeded sampling), precisely so the surrounding process remains a repeatable machine.
- **The system the model is *deployed into* is also a traditional, repeatable machine.** The serving infrastructure — the API server, request routing, authentication, logging, rate limiting, retries, caching — is conventional Von Neumann software with the same reliability requirements as any other production backend (Chapter 8, Chapter 9). The model's nondeterministic core is deliberately isolated behind a narrow, well-defined interface: a request goes in, a response comes out, and everything *around* that boundary — how the request got there, how the response is logged, validated, retried, or rejected — is deterministic code that can be tested, versioned, and reasoned about like any other component.

The general pattern: **a probabilistic model of computation does not replace the deterministic machine — it becomes a component embedded inside one.** This is true of LLMs, and it was already true of the Monte Carlo simulations and probabilistic models in §1.3: nobody builds an air-traffic control system as an unconstrained probabilistic process, but plenty of reliable systems use a probabilistic model as one well-bounded piece of a larger, deterministic architecture. Reliability is fundamentally a claim about repeatability, and repeatability is a property of the traditional machine surrounding the model, not of the model's own outputs. This is why, even as programming languages are increasingly used to build and orchestrate ML systems, the *systems themselves* — the build toolchain and the production target alike — remain, and must remain, traditional repeatable machines. That is the mainstay of reliable software, and it is not going away.

### 1.6 Who Writes the Deterministic Machine, and Who Owns It

§1.5 argued that the machinery around a probabilistic model — the training pipeline, the serving API — has to stay a traditional, repeatable machine for the system to be reliable. That argument has an increasingly important corollary: a growing share of that deterministic machinery is now itself *written by an LLM*. Code-generation assistants draft functions, tests, SQL migrations, and API handlers — exactly the ordinary, deterministic, Von Neumann code this document spends Parts II and III describing — and the share they draft keeps growing.

That doesn't change what §1.5 already established: the resulting code is still deterministic, still version-controlled, still testable, still auditable. What it changes is *who is accountable for it*. A commit in version control has an author. A pull request has a reviewer. A production incident gets debugged by an engineer, not by whichever tool drafted the function months earlier. None of that responsibility transfers to the LLM that helped write the code — it stays with whoever reviewed it, merged it, and shipped it.

This is where §1.5's argument turns from a claim about systems into a claim about people. Repeatability is what makes code *possible* to debug, test, and audit — it does not make any of that happen automatically, and it never has. Someone still has to read the deterministic code closely enough to know whether it is actually correct, and that is a skill, not a byproduct of the code having been generated by a capable tool.

> **Understanding doesn't become optional because a tool can write code faster than you can. It becomes the entire job.**

As a student, this is the practical stake in the rest of this document. Understanding grammars and ASTs (Chapter 7) is what lets you read and trust a parser regardless of who wrote it. Understanding paradigms (Part II) is what lets you recognize when generated code's structure doesn't fit the problem it's solving. Understanding memory management (§6.3) is what lets you spot a use-after-free introduced into manually-managed code, or a reference cycle a generated Swift type forgot to break. None of that fluency is optional overhead on top of "using an LLM well" — it *is* what using one well means for an engineer, because it's what lets you tell, quickly, whether a tool's output deserves your signature. If you can't read and verify the deterministic code a model hands you, you aren't directing the system's architecture or catching its gaps — you're hoping it works. Hoping is not a strategy this document, or the discipline it describes, can build reliable systems on.

---

## Part II — Programming Language Paradigms

### 2. Categories of Programming Languages

A **paradigm** is a style of describing computation to a language's underlying model (almost always Von Neumann, per Chapter 1). Four categories recur throughout this reference:

| Paradigm | Answers the question | Typical examples | Best suited for |
|---|---|---|---|
| **Procedural** | "What sequence of steps?" | C, early Python/JS style | Deterministic systems needing literal, ordered instructions (embedded control, flight software) |
| **Object-Oriented** | "What objects, with what behavior?" | Java, Python, C++, C# | Modeling real-world entities; large teams; code reuse |
| **Functional** | "What transformation of inputs to outputs?" | Haskell, Scala, functional-style JS | Data transformation pipelines; concurrent/parallel systems |
| **Logic / Declarative / Constraint-Based** | "What must be true?" | Prolog, SQL, HTML/CSS | UI layout, database queries, rule-based reasoning |

#### 2.1 Procedural

The oldest and most direct mapping onto Von Neumann hardware: a program is a sequence of steps, executed in order, like a recipe. Procedural code is the natural first paradigm to learn because it mirrors how the CPU actually works, and it remains the right choice wherever a system needs strict, literal, auditable control flow — flight-control software, industrial safety systems, and other domains where "the program did exactly what the listing says, in that order" is itself a requirement. Its cost is that it can become verbose and inflexible as a system grows, particularly once it has to account for many exceptional cases (see the comparison with functional style in §2.3 and §4.5).

#### 2.2 Object-Oriented

Organizes code around **objects** — bundles of data and the behavior that operates on it — rather than around a sequence of steps. See Chapter 3 for a full treatment.

#### 2.3 Functional

Treats functions as first-class values and structures programs as compositions of functions rather than sequences of state mutations, aiming for **pure functions**: given the same input, always the same output, with no side effects. See Chapter 4.

#### 2.4 Logic, Declarative, and Constraint-Based Languages

Describes **what** should be true, and leaves **how** to achieve it to an engine (an inference engine, a query planner, a layout/constraint solver). This is a broader category than "logic programming" in the Prolog sense — it also covers UI-layout languages and query languages, which is why this reference treats HTML, CSS, and SQL as members of the same family as Prolog. Chapter 5 develops this in depth, including the case for classifying HTML/CSS and SQL this way.

#### 2.5 Matching Languages to Users and Problems

- **Procedural languages** suit users who need straightforward, literal instructions.
- **Functional/declarative languages** suit users focused on data transformations or specifying an outcome (a UI, a query) rather than a procedure.
- **General-purpose languages** offer flexibility, but that same flexibility is a risk in safety- or security-critical contexts if misused.
- **Domain-specific languages** intentionally limit what can be expressed, trading generality for safety and predictability — a **constraint-based language** (§2.4) is, in this sense, a domain-specific language for "what state should the UI/data be in," and its restrictions are a feature, not a limitation.

---

### 3. Object-Oriented Programming in Depth

#### 3.1 Core Concepts

- **Objects and classes** organize code into reusable units that model real-world (or application) entities — e.g., a `ParkingSpot` object with properties like `floor` and `status`.
- **Inheritance** lets subclasses reuse a parent class's attributes and methods.
- **Encapsulation** bundles data and methods within a class while restricting access to internal parts (public vs. private).
- **Abstraction** exposes only essential features, hiding implementation detail.
- **Polymorphism** lets the same method behave differently depending on the object's actual type.

**Object-based vs. object-oriented**: object-based programming uses objects without a strict class hierarchy or inheritance; object-oriented programming adds inheritance and hierarchical organization on top.

#### 3.2 Inheritance Models and the Diamond Problem

- **Single inheritance**: each class has exactly one parent. Simpler, avoids ambiguity (Java's model).
- **Multiple inheritance**: a class can inherit from more than one parent, which introduces the **diamond problem** — if two parent classes share a common ancestor, the compiler can't unambiguously resolve which version of an inherited member to use. C++ resolves this with **virtual inheritance**; many languages (Java, C#) simply disallow multiple *class* inheritance and offer interfaces instead.

#### 3.3 Interfaces vs. Abstract Classes

- **Interfaces** define a contract (method signatures) with no implementation and no state, which is how single-inheritance languages like Java and C# still support "multiple inheritance of behavior" without the diamond problem — there's no shared state to conflict over.
- **Abstract classes** are templates with *some* implemented methods, offering shared structure while still requiring subclasses to fill in the rest.

#### 3.4 OOP Across Languages

| Language | Inheritance | Notes |
|---|---|---|
| **C++** | Single and multiple | Virtual inheritance resolves the diamond problem |
| **Java** | Single (classes), multiple (interfaces) | Interfaces provide flexible, conflict-free composition |
| **Python** | Multiple | No enforced access control; a leading underscore is a *convention* for "private," not a rule |
| **JavaScript** | Prototype-based | No formal privacy; conventions (or newer `#private` fields) simulate it |

---

### 4. Functional Programming in Depth

#### 4.1 Pure Functions and Immutability

A **pure function** returns the same output for the same input and has no side effects — it doesn't modify global state, mutate its arguments, or depend on anything but its inputs. **Immutable data** is never changed in place; a "modification" instead produces a new value.

Functional programming's central goal is to avoid changing state as a program executes at all — where procedural code accumulates state changes over its run (making the current state a function of *history*, which is harder to reason about), functional code describes a transformation directly. A useful analogy from the notes: procedural programming is like a movie, where you must track changes over time; functional programming is like a picture, where everything simply *is*, statically.

#### 4.2 Why Functional Code Scales

- **Testability**: a pure function always produces the same output for a given input, so it's trivially easy to write a test for.
- **Parallelization**: with no shared, mutable state, independent functional computations can run concurrently without coordination — this is a large part of why functional style is attractive for microservices and other systems that need to scale horizontally.
- **Compiler optimization**: without state changes to track, a compiler has more freedom to reorder, cache, or parallelize execution.

#### 4.3 Const, Aliasing, and "Everything Is an Object"

- Declaring a value `const` locks it after initialization — a lightweight, procedural-language-friendly way to borrow functional programming's immutability guarantee for a single value.
- **Aliasing** occurs when two variables reference the same underlying object; mutating through one alias is visible through the other. This is a hazard specifically for *mutable* objects — immutable primitives sidestep it entirely, because "modifying" them (e.g., `y = x + 1`) always creates a new object rather than changing the one `x` still points to.
- In "everything is an object" languages (Python, Java, Ruby, Scala), even primitives like integers live on the heap as objects — which is exactly why their immutability matters: without it, `y = x` followed by a mutation of `y` could silently change `x` too.

#### 4.4 Functional Programming on the JVM

Scala runs on the JVM and blends functional and object-oriented paradigms, giving it access to the JVM's JIT-optimized execution while offering the testability and parallelizability benefits of a functional style. Immutable objects are central to Scala's design, and Java itself already makes strings and (boxed) integers immutable by default, for the same aliasing-safety reason described above.

#### 4.5 Functional Patterns in Non-Functional Languages

Most languages used in production are not purely functional — JavaScript, Python, and Java all permit mutation, side effects, and global state. But a developer can still choose to write **functionally**, even inside an imperative language, and doing so captures the same testability and parallelizability benefits described in §4.2:

- Prefer functions with no side effects — take arguments, return a value, touch nothing else.
- Prefer returning new data over mutating arguments in place.
- Prefer higher-order functions (`map`, `filter`, `reduce`) over hand-written loops with a mutable accumulator.
- Prefer `const`/`final`/`readonly` declarations wherever a value shouldn't change after creation.

A minimal example — summing without ever mutating a loop variable, using recursion instead of a `for` loop with an accumulator:

```python
def sum_n(n):
    if n == 0:
        return 0
    return n + sum_n(n - 1)
```

Chapter 9 (the Parking App case study) develops this pattern in a realistic setting: a fee-calculation function and an availability filter, each written both the procedural way and the functional way, inside the same JavaScript codebase.

#### 4.6 Black-Box Functional vs. Pure Functional Design

§4.1's definition of a pure function — same input, same output, no visible side effects — is a statement about a function's *boundary*, not about every line of code inside it. That distinction matters enough in practice to name separately:

- **Pure functional design** enforces immutability all the way down: every intermediate step avoids mutation, typically via recursion and persistent (structurally-shared) data structures rather than loops with mutable state.
- **Black-box functional design** (sometimes called *observational purity* or *referential transparency*) only requires that the function's *external contract* be pure. Internally, it's free to use loops, mutable local variables, and in-place buffer construction — ordinary imperative steps — as long as none of that mutation is visible to, or shared with, the caller. From outside the function, a black-box-functional implementation is indistinguishable from a pure one: same input, same output, nothing else touched.

This is not a compromise or a lesser form of functional programming — it's what functional programming almost always means in practice once performance matters. A fully persistent implementation (reallocating and copying structure on every incremental change) is often prohibitively expensive; a black-box implementation gets the same external guarantees — testability, safety under parallel calls, no aliasing surprises for the caller — while doing the actual work with cheap, local mutation. `Array.prototype.reduce`, used functionally in §9.3's `dailyRevenue` pipeline, is a good example: its *interface* is pure (it doesn't mutate the array you call it on, and repeated calls with the same inputs return the same result), but a typical engine implementation walks the array with an ordinary mutable index and accumulator internally. The caller only ever sees the pure boundary.

**Large state is exactly where this distinction stops being academic.** Once the state being transformed is large — a big reservation table, a large in-memory cache, a sizable matrix — pure-functional style in the strict sense (copy-on-write at every single step) means allocating a new copy of a large structure for every incremental change, which does not scale. Production functional systems handle this by keeping mutation local and hidden: persistent data structures use structural sharing internally (so only the changed part is copied, not the whole structure), and hand-written hot paths use a bounded internal buffer that's mutated in place and only exposed once, at the end, as an immutable result. In other words, black-box functional design is often not an optional style choice but a necessity — it's what makes functional-style code hold up against real workloads instead of just small examples.

#### 4.7 Functional Architecture: REST APIs as Stateless Functions

The same purity idea in §4.1 generalizes past a single function, up to the architecture of an entire service. A RESTful API endpoint, viewed abstractly, is a function from *(persisted state, request)* to *(response, new persisted state)* — and REST's defining constraint, **statelessness**, is precisely the requirement that this be the *only* state the function depends on: "each request from a client to a server must contain all the information needed to understand and complete it," with nothing held over in server memory from a previous request.

That constraint is a system-level application of §4.1's purity requirement: two requests with the same inputs (the same persisted database state, per Chapter 5's SQL-as-constraints view, plus the same request body) should produce the same response, regardless of which server process handles them or what requests that process handled before. And it earns the same payoff as §4.2's function-level argument, just at a larger scale — because no server instance holds request-to-request state, any server instance can handle any request, which is exactly why stateless REST APIs (like the Parking App's `/reservations` handler in §9.5) can be load-balanced across many interchangeable server instances while all the actual consistency lives in one place: the database. Statelessness at the API layer is functional purity applied to *services* instead of *functions* — the "no side effects, no shared mutable state" argument for scalability, one level up.

---

### 5. Logic and Constraint-Based Languages

#### 5.1 Prolog

Prolog ("Programming in Logic") is a declarative language built from three ingredients:

- **Facts** — static truths: `color(desk, brown).`
- **Rules** — facts combined to infer new truths: `play(X) :- likes(mike, X), likes(mary, X).`
- **Queries** — questions posed against the database: `?- play(X).`

Prolog's engine searches the facts and rules to satisfy a query; the programmer specifies *what* is true, not *how* to search for it. The database can be updated dynamically with `assert` (add a fact/rule) and `retract` (remove one).

**Applications**: expert systems (diagnosing car, medical, or hardware problems), knowledge representation, real-time logical decision-making, and complex search problems such as geometric reasoning for robots or pathfinding over a graph of facts like `path(a, b).`

**Strengths**: a natural fit for problems with logical constraints; eliminates the need to hand-write search algorithms; high-level abstraction simplifies certain problem classes.

**Weaknesses**: inefficient for large datasets compared to SQL or imperative languages; can become computationally expensive for deeply nested logical structures; debugging and optimization are harder than in procedural code.

#### 5.2 HTML and CSS as Constraint Languages

HTML and CSS are usually introduced as "markup" and "styling," but they belong in the same paradigm family as Prolog: they are **declarative, constraint-based languages**, and the browser is their inference/solving engine.

- **HTML** declares a document's structure and content as a tree — the **DOM** (Document Object Model) — not as a sequence of drawing instructions. `<html>` typically contains `<head>` (metadata) and `<body>` (content), and elements nest to form a hierarchy that the browser interprets, not one the page author manually renders step by step.
- **CSS** declares *constraints* on that tree: "elements matching this selector should have this background color; this font size; this layout." A CSS rule doesn't say *how* to paint pixels — it says what should be true of the rendered result, and the browser's layout engine solves for it.
- **Selectors and specificity** are the constraint-resolution mechanism: when multiple rules could apply to the same element (a tag selector, a class selector, an ID selector), CSS resolves the conflict via a specificity score rather than "whichever rule ran last," which is precisely the kind of conflict-resolution logic a constraint solver needs.
- **Flexbox and grid layout** make the constraint-solving nature explicit: a flex container doesn't get told the pixel width of each child; it's given constraints (`flex-grow`, `flex-shrink`, `flex-basis`) and *solves* for a layout that satisfies them, the same way Prolog's engine solves a query against a rule set.

#### 5.3 SQL as a Constraint Language

SQL fits the same family. A `SELECT` statement specifies constraints on the desired result set (`WHERE`, `JOIN ... ON`, `GROUP BY`) rather than a retrieval algorithm; the query planner decides *how* to execute it (index scan vs. sequential scan, join order, and so on) — exactly the what/how split from §2.4.

- **Schema as constraints**: `PRIMARY KEY`, `FOREIGN KEY`, `NOT NULL`, and `CHECK` are constraints on what data is even allowed to exist, enforced by the database engine rather than by application code.
- **CRUD**: `INSERT` (create), `SELECT` (read), `UPDATE`, `DELETE` — the four operations that change or query the fixed state a schema constrains.
- **Joins** combine rows from multiple tables based on a relationship (e.g., `SELECT * FROM reservations JOIN users ON reservations.user_id = users.id`), letting normalized data be queried back together without duplicating it.
- **Normalization / DRY**: store each fact once (e.g., a user's name lives in the `users` table, not copied into every row that references that user) so that updates stay consistent — the database-design version of "don't repeat yourself."
- **Transactions** treat a group of state changes (e.g., debit one account, credit another) as a single all-or-nothing unit, which is what makes SQL safe for concurrent, multi-user systems like banks or social platforms.

#### 5.4 The Common Thread: What, Not How

Prolog, HTML/CSS, and SQL all separate the specification of a desired state from the mechanism that achieves it:

| Language | You declare... | The engine solves... |
|---|---|---|
| Prolog | Facts, rules, a query | Which facts/rules satisfy the query (search/backtracking) |
| HTML/CSS | Structure and style constraints | Where each pixel actually goes (layout algorithm) |
| SQL | The shape of the desired result set | How to retrieve/join/filter it efficiently (query planning) |

This is the same what/how split introduced in §2.4 and §2.5 for constraint-based/domain-specific languages generally — and it's why HTML/CSS and SQL are grouped with Prolog in this reference rather than treated as an unrelated "web stuff" category.

---

## Part III — Language Mechanics

### 6. Typing, Memory, and Mutability

#### 6.1 Static vs. Dynamic Typing

- **Dynamically typed** languages (JavaScript, Python) allow "type-free" code, which is fast to write but can create maintenance problems as a codebase grows, since type mismatches surface only at runtime.
- **Statically typed** languages (or supersets, like TypeScript over JavaScript) catch type errors at compile time. Typing functions as a lightweight, automated form of testing: it catches an entire category of runtime errors before the program ever runs.

#### 6.2 Stack, Heap, and "Everything Is an Object"

- **Stack** and **heap** are the two memory regions used at runtime. In languages like C++, the programmer explicitly chooses which objects live where.
- In **"everything is an object"** languages (Python, Java, Ruby), most values live on the heap, and variables are references (pointers) to them. This simplifies the object model but makes **immutability** important for primitive types, precisely to avoid the aliasing hazard described in §4.3.

#### 6.3 Aliasing, Immutability, and Garbage Collection

Once objects live on a heap, something has to reclaim memory that's no longer reachable. Three common strategies:

- **Reference counting**: each object tracks how many references point to it; when the count hits zero, it's freed. Simple and deterministic, but it cannot handle **cyclic references** — e.g., two linked-list nodes that point at each other will never reach a zero count, even after both are otherwise unreachable.
- **Mark-and-sweep**: a more robust technique that pauses execution, traverses live objects from a set of roots (e.g., the stack), and deallocates whatever wasn't reached. Handles cycles correctly, but the pause makes it unsuitable for real-time systems.
- **Generational garbage collection**: optimizes performance by grouping objects by lifespan (most objects die young), which is the strategy most general-purpose garbage collectors use today.

**Why mark-and-sweep and real-time systems don't mix.** A real-time deadline is a promise about *when* work finishes, not just *whether* it finishes. Mark-and-sweep (and its generational variants) pay for their correctness — handling cycles, reliably reclaiming everything unreachable — with a "stop-the-world" pause whose timing and length aren't fully predictable from the application's point of view: the collector runs when *it* decides memory pressure warrants it, not when the application would prefer to be interrupted. A pause landing in the middle of a hard deadline (an engine-control loop, an audio callback, a flight-control cycle) is a missed deadline. That unpredictability — not raw speed — is the actual disqualifying property for real-time and safety-critical code.

**This is why C, C++, and Rust don't rely on a garbage collector at all, for two different reasons:**

- **C and C++** never adopted one in the first place. Manual allocation and deallocation (`malloc`/`free`, `new`/`delete`) puts the timing of every free entirely under the programmer's control, which is exactly the determinism real-time and systems-level code (§2.1) needs — at the cost of the programmer being fully responsible for getting it right, with no compiler-enforced safety net. Use-after-free, double-free, and dangling-pointer bugs are the price of that manual control.
- **Rust** removes the *need* for a collector through a third strategy: an **ownership and borrowing model**, checked entirely at compile time. Every value has exactly one owner; when that owner goes out of scope, the compiler inserts the deallocation there, deterministically, with no separate collector pass ever running. Rust also closes the safety gap C/C++ leave open: the borrow checker statically proves that a value is never freed while another part of the program still holds a reference to it, which rules out use-after-free and double-free *before the program compiles*, rather than leaving them as a runtime risk.

| Strategy | Frees memory... | Real-time suitability | Characteristic failure mode |
|---|---|---|---|
| Reference counting (Swift's ARC) | Immediately, when a count hits zero | Good in the common case — no scheduled, separate pause | A large object graph's last reference dropping can cascade into many synchronous frees on one thread |
| Mark-and-sweep / generational GC (Java, Python, JS engines) | Periodically, in batches, whenever the collector decides to run | Poor — the "stop-the-world" pause is unpredictable in timing and length | A pause can land inside a hard deadline, which is why real-time systems avoid it entirely |
| Ownership & borrowing (Rust) | Deterministically, at a compile-time-determined scope exit — no runtime collector at all | Excellent — every free happens inline, at a known point | The compiler rejects programs it can't prove memory-safe; some valid patterns need restructuring (or an explicit `unsafe` block) to compile |

Swift takes a middle path — reference counting (avoiding mark-and-sweep's scheduled pause) plus **weak references** to explicitly break cycles — which is why real-time-adjacent applications favor Swift's model over Java's or Python's stop-the-world collectors. But "no GC pause" is not the same claim as "no possible pause," and Swift's own tradeoff is the standard illustration: ARC's retain/release bookkeeping runs inline with ordinary code rather than in a separate collector pass, so its cost is spread out rather than batched — *except* when it isn't. Dropping the last reference to a single large, deeply-nested object graph (a big view hierarchy, a large cached response) can trigger a cascading chain of deallocations synchronously, on whatever thread let go of it — often the UI/main thread. That cascade is exactly what produces macOS's spinning "beachball" cursor: not a scheduled GC pause, but a burst of many small, deterministic ARC frees that all happen to land on the same thread at the same instant. The lesson generalizes: eliminating a GC's *scheduled* pause doesn't eliminate the *possibility* of a pause — it just changes where that cost can show up and who's responsible for controlling it.

#### 6.4 Call by Value, Call by Reference, and Call by Value-of-Reference

- **Call by value**: a copy of the argument is passed; changes inside the function don't affect the caller's variable. Common for primitives in C, Python, and JavaScript.
- **Call by reference**: the address of the variable is passed, so the function can modify the caller's original value directly (e.g., C++'s `int &x`).
- **Call by value, where the value is a reference**: this is what Python and JavaScript actually do, and it's the source of a lot of confusion. Primitive types (numbers, strings) are immutable, so they *behave* as if passed by value. Mutable types (lists, objects) are passed as a copy of a reference — so reassigning the parameter inside the function doesn't affect the caller, but mutating the object it points to does:

```python
def modify_list(lst):
    lst.append(4)

a = [1, 2, 3]
modify_list(a)
print(a)  # [1, 2, 3, 4] — the mutation is visible outside the function
```

---

### 7. Compilation and Parsing

#### 7.1 The Compiler Pipeline

A compiler's job is to translate human-readable source code into machine code (or another executable form). The standard pipeline:

1. **Lexical analysis** — turns the raw byte/character stream into **tokens**: keywords, operators, identifiers.
2. **Syntax analysis (parsing)** — checks the token sequence against the language's grammar and builds a parse tree or AST.
3. **Semantic analysis** — checks that the code's *meaning* is valid (e.g., type checking).
4. **Intermediate code generation** — lowers the syntax tree into an intermediate representation.
5. **Optimization** — refines the intermediate code for performance.
6. **Code generation** — converts optimized intermediate code into machine code or bytecode.
7. **Assembly and linking** — combines machine code segments into a final executable.

#### 7.2 Character Encoding

Before tokenizing, a compiler (or any text-processing system) has to turn a byte stream into a character stream:

- **UTF-8**: a variable-length encoding — ASCII characters take one byte, other Unicode code points take more. The default on Unix-like systems (macOS, Linux).
- **UTF-16**: fixed 2-byte units for the common case, used in Windows and the JVM.

#### 7.3 Grammars, Parse Trees, and ASTs

A **grammar** defines the valid structure of a language — how expressions, terms, and other constructs may combine. A **context-free grammar** applies each rule to a nonterminal independently of its surrounding context.

- A **parse tree** documents *every* grammar substitution used to derive an expression — thorough, but verbose.
- An **abstract syntax tree (AST)** is a condensed form that keeps only the operations and values that matter semantically, discarding intermediate grammar bookkeeping. The AST is what most later compiler stages (evaluation, code generation, optimization) actually operate on.

For `3 + 4 * 2`, the parse tree records every rule application; the AST simply shows:

```
      +
     / \
    3   *
       / \
      4   2
```

#### 7.4 Recursive Descent vs. Shift-Reduce Parsing

| | Recursive Descent | Shift-Reduce |
|---|---|---|
| **Mechanism** | Each grammar rule becomes a function; functions call each other recursively (top-down) | Bottom-up: tokens are pushed ("shifted") onto a stack and combined ("reduced") per grammar rules, using a state machine |
| **Pros** | Simple, intuitive to hand-write | Handles a broader, more complex range of grammars, including left recursion |
| **Cons** | Breaks on **left-recursive** grammars (a rule that calls itself with no input consumed first causes infinite recursion) — grammars must be right-recursive | Typically requires a generator tool (YACC, Bison) rather than being hand-written |

#### 7.5 Regular Expressions

Regex is a compact language for matching patterns in text — the standard tool for input validation, tokenization, and text search.

| Construct | Meaning |
|---|---|
| `^` / `$` | Start / end of string |
| `[ ]` | Character class, e.g. `[a-z]` |
| `\| ` | Alternation ("or") |
| `( )` | Grouping |
| `{n,m}` | Between `n` and `m` repetitions |
| `*` / `+` / `?` | Zero-or-more / one-or-more / zero-or-one |
| `.` | Any character except newline |
| `\` | Escapes a special character |

A username pattern requiring a leading letter, e.g. `^[A-Za-z][A-Za-z0-9]{0,19}$` (max 20 characters); a hexadecimal-integer pattern, `^0[xX][0-9A-Fa-f]+$`. Regex libraries are standardized across languages precisely so this kind of pattern doesn't need a custom implementation per project.

#### 7.6 Worked Example: Parsing JSON

A small, complete illustration of §7.1–§7.3: parsing a JSON string into an AST.

**Grammar (informal)**:

- `element` → a `value` with optional surrounding whitespace
- `value` → object `{...}` | array `[...]` | literal (`true`/`false`/`null`) | number | string
- `object` → `{}` | `{members}`
- `members` → `member (, member)*`
- `member` → `string : element`

**AST node classes** (one per grammar construct): `ObjectNode(members)`, `ArrayNode(elements)`, `MemberNode(key, value)`, `LiteralNode(value)`, `NumberNode(number)`, `StringNode(string)`.

For the input:

```json
{ "x": [1, 2], "y": [3, true] }
```

the parser produces an `ObjectNode` with two `MemberNode`s — `"x"` mapping to `ArrayNode([NumberNode(1), NumberNode(2)])`, and `"y"` mapping to `ArrayNode([NumberNode(3), LiteralNode(true)])`.

Implementation notes: start from the highest-level rule (`parse_element`) and work down; centralize whitespace stripping in helper functions; raise a clear `SyntaxError` on malformed input; and test against empty structures (`{}`, `[]`), nested structures, and deliberately invalid input (unquoted keys, missing closing quotes).

---

### 8. Runtimes, Platforms, and Reproducible Builds

#### 8.1 The JVM

The **Java Virtual Machine** lets one bytecode format run unmodified across platforms — "write once, run anywhere." Source is compiled to bytecode, which the JVM then executes, using **Just-In-Time (JIT) compilation** to optimize frequently executed code paths at runtime. Several languages beyond Java target the JVM to inherit this portability and optimization — Scala and Kotlin among them.

Android is a notable exception: rather than shipping Sun/Oracle's JVM, Android historically used its own library that mimicked Java's syntax and standard library without licensing the JVM itself — a decision that led to a long legal dispute between Google and Oracle (Sun's successor) over the Java APIs, and part of why Kotlin (JVM-compatible but independently developed) became Android's preferred language. Android compiles directly to native machine code rather than running a traditional JVM, trading portability for mobile performance.

#### 8.2 .NET and the CLR

Microsoft's counterpart to the JVM: the **Common Language Runtime (CLR)** runs C# and other .NET languages, using the same "compile to an intermediate representation, then optimize at runtime" strategy as the JVM.

#### 8.3 Containers as a Portability and Reproducibility Layer

Containers (e.g., Docker) abstract away the underlying machine, the same way a VM or a language runtime does, but more cheaply: rather than running a full guest OS (as traditional virtualization does), a container shares the host kernel and isolates only the process and its dependencies. That makes a development or deployment environment **lightweight and exactly reproducible** across machines — the same guarantee discussed abstractly in §1.5: a system's *infrastructure* needs to be repeatable even when what runs inside it doesn't need to be identical every time. Cross-architecture differences (e.g., ARM-based Apple Silicon vs. Intel) can still surface here, sometimes requiring an emulation layer, at a performance cost.

---

## Part IV — Case Study

### 9. The Parking App: One System, Many Languages

The rest of this reference has treated paradigms and mechanics in isolation. Real systems mix them, layer by layer, and the mixing is not arbitrary — it follows directly from Chapter 2's observation that different paradigms answer different questions well. This chapter works through one small system, a **Parking App**, that reserves spots in a garage, to make that concrete.

#### 9.1 Architecture

The app has three tiers, each implemented in a language chosen for what that tier needs to express:

```
Browser (React + HTML/CSS)          Node.js/Express server            PostgreSQL
  structure & layout: HTML/CSS  --   business logic: JavaScript   --   data & constraints: SQL
  component composition: JS         (procedural + functional)         (declarative)
        |  reserve spot (JSON over HTTP)  |   parameterized query (SQL)   |
        +-------------------------------->+------------------------------>+
        |  <-- available spots (JSON) --  |  <-- rows (result set) ------ |
```

- **Frontend**: React renders the UI; HTML describes the DOM structure (a spot grid, a reservation form); CSS constrains its layout and appearance (§5.2).
- **Backend**: Node.js with Express handles HTTP requests, runs business logic (fee calculation, availability checks), and talks to the database. This layer is JavaScript, a general-purpose, multi-paradigm language — written here with a mix of procedural request-handling and functional data transformations (§9.3).
- **Database**: PostgreSQL stores users, spots, and reservations, with the schema itself expressing constraints (§9.4).

A minimal schema:

```sql
CREATE TABLE spots (
  id SERIAL PRIMARY KEY,
  floor INT NOT NULL,
  spot_number INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'reserved', 'occupied'))
);

CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  spot_id INT NOT NULL REFERENCES spots(id),
  plate TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  CHECK (end_time IS NULL OR end_time > start_time)
);
```

#### 9.2 Why the Coupling Is Not an Accident

It's tempting to describe a full-stack app as "coupling three unrelated languages," but each choice tracks §2's paradigm categories directly:

- The database layer is declarative/constraint-based (§5.3) because the problem it solves — "what data may exist, and what subset of it satisfies this query" — is naturally a *what*, not a *how*.
- The frontend's structure/style layer is declarative/constraint-based (§5.2) for the same reason: "what should this page look like" is a *what*.
- The backend layer is a general-purpose, multi-paradigm language (JavaScript) because request handling is inherently procedural (do these steps, in this order, for this HTTP request) while its data transformations are naturally functional (§4.5) — and a general-purpose language lets both styles coexist where each fits best.
- JSON is the interchange format at every boundary (browser ↔ server, and conceptually, server ↔ any other service) precisely because it's a lightweight serialization of the same tree-shaped data that both HTML's DOM (§5.2) and JavaScript's object model already use — the coupling between layers is real, but it's coupling through a shared, simple data shape, not through shared code.

#### 9.3 Functional Patterns in the Parking App's JavaScript

JavaScript is not a functional language — it has mutable objects, arrays, and module-level state — but the backend's business logic reads far better, and tests far more easily (§4.2), written in a functional style. Compare a fee calculation written procedurally:

```js
function calculateFeeProcedural(reservation) {
  let minutes = (reservation.endTime - reservation.startTime) / 60000;
  let fee = minutes * RATE_PER_MINUTE;
  if (fee < MINIMUM_FEE) {
    fee = MINIMUM_FEE;
  }
  return Math.round(fee);
}
```

against the same logic as a pure function:

```js
const calculateFee = (reservation, rate = RATE_PER_MINUTE, minimum = MINIMUM_FEE) => {
  const minutes = (reservation.endTime - reservation.startTime) / 60000;
  return Math.max(Math.round(minutes * rate), minimum);
};
```

The functional version takes its rate and minimum as arguments rather than reading module-level constants directly, never reassigns a variable, and is trivial to unit-test with fixed inputs. The gap becomes more visible once fees need to be aggregated across many reservations — the functional style composes with `filter`/`map`/`reduce` instead of a hand-rolled mutable-accumulator loop:

```js
// Functional: no mutable accumulator, reads as a pipeline
const dailyRevenue = reservations
  .filter(r => r.status === "completed")
  .map(calculateFee)
  .reduce((total, fee) => total + fee, 0);

// Procedural: state accumulates across a mutable loop variable
let dailyRevenueProcedural = 0;
for (let i = 0; i < reservations.length; i++) {
  if (reservations[i].status === "completed") {
    dailyRevenueProcedural += calculateFeeProcedural(reservations[i]);
  }
}
```

Both compute the same number. The functional version is the one that's safe to run in parallel across reservation batches (§4.2) and the one where a bug can't hide in a stray mutation of `dailyRevenueProcedural` from unrelated code elsewhere in the loop body.

The same pattern governs a spot-availability check:

```js
const availableSpots = spots.filter(spot => spot.status === "open");
```

— a one-line constraint ("give me the spots where status is open"), not a loop that manually builds up a result array.

#### 9.4 HTML/CSS and SQL as the App's Constraint Layers

The Parking App is a clean illustration of §5.4's "what, not how" split, because it uses *both* constraint languages side by side for two different kinds of state:

- **CSS constrains the visual state** of the spot grid — e.g., a rule that any `.spot` with class `.spot--open` renders green, regardless of which specific spot elements exist at a given moment. The browser's layout engine resolves this for however many spots are actually on the page; the app never manually computes pixel positions.
- **SQL constrains the data state** of the garage — e.g., the `CHECK (status IN ('open', 'reserved', 'occupied'))` constraint in §9.1 makes an invalid status impossible to store, regardless of which code path inserts or updates a row. The database enforces this uniformly, the same way CSS specificity uniformly resolves conflicting style rules (§5.2).

Both layers let the application code (§9.3) stay focused on procedural/functional business logic, because "what states are even valid" has already been pushed down into a constraint layer that enforces itself.

#### 9.5 Asynchronous Programming in the Booking Flow

The backend's request handlers are I/O-bound — every reservation involves waiting on the database — which is exactly the case async/await was designed for (this generalizes the async programming ideas introduced in Chapter 8's discussion of runtimes). Each handler is also a concrete instance of §4.7's REST-as-function argument: it reads current state fresh from PostgreSQL, computes a response, writes back new state, and retains nothing in server memory afterward — which is what lets any server instance handle any reservation request.

- **Blocking style** (traditional procedural code in C or Python) waits for each operation to finish before moving to the next line, which would leave the server unable to handle other requests while one reservation's database round-trip is pending.
- **Non-blocking / event-driven style** (Node.js's model) lets the server start a request, move on to other work, and resume the request once its I/O completes — handled historically via **callbacks**, which nest awkwardly for multi-step flows ("callback hell"), then via **promises**, and now idiomatically via **async/await**, which lets asynchronous code read like synchronous code:

```js
app.post("/reservations", async (req, res) => {
  const spot = await findAvailableSpot(req.body.floor);
  if (!spot) {
    return res.status(409).json({ error: "No open spots on that floor" });
  }
  const reservation = await createReservation(spot.id, req.body);
  res.status(201).json(reservation);
});
```

Node's **event loop** is what makes this scale: rather than dedicating a thread to each pending reservation, it continuously checks for completed I/O and resumes the corresponding handler, which is why a Node.js backend can serve many concurrent reservation requests with comparatively few server resources.

#### 9.6 Security: Where Language Design Meets the Parking App

Two of the vulnerability classes most relevant to a language's design surface directly in this app, at the boundary where one language's output becomes another language's input:

- **SQL injection**, at the JavaScript → SQL boundary. If a license plate lookup is built by string-concatenating user input into a query, an attacker can supply input that changes the query's *meaning*, not just its data:

```js
// Vulnerable: user input becomes part of the SQL syntax itself
const query = `SELECT * FROM reservations WHERE plate = '${plate}'`;

// Safe: the value is passed separately from the query structure
const result = await db.query(
  "SELECT * FROM reservations WHERE plate = $1",
  [plate]
);
```

  A **parameterized query** keeps data and code separate at the language boundary — the same data/code separation principle that underlies every injection defense. This is also where §1.6's ownership point gets concrete: an LLM-drafted handler can *look* like it follows this pattern — a `$1` placeholder here, a `db.query` call there — while a different line elsewhere in the same file quietly concatenates unsanitized input. The code is deterministic and, in principle, fully auditable; whether that vulnerability actually gets caught depends entirely on whether a human reviewer understands the pattern well enough to check for it.

- **HTML injection / XSS**, at the JavaScript → HTML boundary. If a reservation note field is rendered into the page without filtering, an attacker-supplied `<script>` tag would execute in another user's browser, with access to that user's cookies and session. The defense is the same shape as SQL injection's: never let untrusted input be interpreted as *structure* (SQL syntax, HTML tags) rather than *data*.

- **Frontend vs. backend validation**: the frontend validates a plate format or a reservation time range to give the user immediate, helpful feedback; the backend re-validates the same fields because frontend validation can always be bypassed by an attacker who skips the UI entirely and calls the API directly. Frontend validation is a UX feature; backend validation is the actual security boundary.

---

## Appendix A — Language Selection Quick Reference

| Concern | Points toward |
|---|---|
| Modeling real-world entities, large team, code reuse | Object-oriented (Java, C#, Python) |
| Data transformation pipeline, need to parallelize/scale | Functional (Scala, Haskell, functional-style JS) |
| Strict, literal, auditable step order (safety-critical) | Procedural (C) |
| "What must be true," not "how to compute it" | Declarative/constraint-based (Prolog, SQL, HTML/CSS) |
| Enterprise backend, existing JVM investment | Java, Scala, Kotlin |
| .NET ecosystem, Microsoft-stack shop | C# |
| High-performance / real-time (games, embedded) | C++ |
| Full-stack web, one language across tiers | JavaScript/TypeScript (+ Node.js) |
| Data science / ML tooling, fast prototyping | Python |
| Large, long-lived codebase in a dynamic language | Add a static layer (e.g., TypeScript over JavaScript) |

Two caveats worth remembering when comparing "popular" languages: popularity rankings (GitHub activity, Stack Overflow tags) are biased by what's public and by what gets asked about — plenty of enterprise code is neither — and a language's popularity in one context (e.g., Python's dominance in classrooms and data science) doesn't automatically transfer to suitability in another (e.g., embedded real-time control, where procedural C still dominates for the reasons in §2.1).

## Appendix B — Glossary

- **AST (Abstract Syntax Tree)** — a condensed parse tree keeping only semantically meaningful structure.
- **Aliasing** — two references pointing at the same mutable object, so a change through one is visible through the other.
- **CLR** — .NET's Common Language Runtime, the .NET counterpart to the JVM.
- **Constraint-based language** — a declarative language whose statements specify allowed/desired states rather than steps (HTML/CSS, SQL, Prolog).
- **Diamond problem** — the ambiguity that arises when a class multiply-inherits from two classes sharing a common ancestor.
- **Encapsulation** — bundling data and behavior in a class while restricting external access to internals.
- **Garbage collection** — automatic reclamation of heap memory no longer reachable by the program.
- **Immutability** — a value that cannot be changed after creation; any "modification" produces a new value instead.
- **JIT (Just-In-Time) compilation** — compiling hot code paths to native machine code at runtime, used by the JVM and CLR.
- **LLM (Large Language Model)** — a neural network trained to model a probability distribution over token sequences; see §1.4.
- **Ownership and borrowing** — Rust's compile-time memory-management model: each value has one owner, freed deterministically at scope exit, with no runtime garbage collector; see §6.3.
- **Parameterized query** — a query where data values are passed separately from query syntax, preventing SQL injection.
- **Parse tree** — the full derivation of an expression via a language's grammar rules.
- **Pure function** — a function with no side effects that always returns the same output for the same input.
- **Recursive descent parsing** — a top-down parsing technique mapping each grammar rule to a function.
- **Referential transparency / black-box functional design** — a function whose external contract is pure (same input, same output, no visible side effects) even though its internal implementation may use ordinary mutation; see §4.6.
- **Shift-reduce parsing** — a bottom-up parsing technique using a stack and state machine.
- **Statelessness** — the REST constraint that a request must be handled using only its own contents plus persisted state, with nothing held over in server memory between requests; see §4.7.
- **Von Neumann architecture** — the classical CPU/RAM/stack model of deterministic, sequential computation.
