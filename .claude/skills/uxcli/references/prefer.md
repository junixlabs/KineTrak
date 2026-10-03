# prefer — a person's eye on two versions, blind

Read when: two versions of a screen exist (two drawings, two builds, before and after a redesign) and
someone wants to know which one people would rather use. You prepare the study; people judge it.

uxcli's probes and walks say what a page did. They do not say which of two pages a person prefers.
That takes people who look at both without knowing which is which. `uxcli prefer` makes that cheap to
run and hard to bias: the pictures are renamed so nothing names a group, each judge sees the pairs in
their own order with the sides swapped by their own seed, and the side a group sat on is recorded by
the server, never by the page.

## The sequence

1. Put the pictures in two folders, the same screen under the same file name in each — for example
   the `-before.png` of a step from two walks, or the `.shots/` of two variants.
2. `uxcli prefer make <study> --a=<folder> --b=<folder> [--question="…"]` writes
   `.uxcli/preferences/<study>/study.json` and `img/`. A study is never rewritten once made; a new
   question is a new study.
3. Each judge — a designer, a user of the product — runs
   `uxcli prefer serve <study> --judge=<their name>` and answers every pair: left, right or cannot
   tell, and why. Their answers land in `judgments/<judge>.json`.
4. `uxcli prefer tally <study>` counts wins per group and a two-sided sign test with ties set aside;
   `--json` carries every reason.

## What is yours, and what is not

- You may make the study, start the page for a judge, and read the tally out in its words.
- You are never a judge. A judgment signed by anything but a person is refused, on anybody's say-so:
  the study exists to put an eye other than yours on the work.
- Do not choose which pictures go in after seeing a tally, and do not drop a judge whose answers you
  do not like. Report the tally with its numbers: who judged, how many answers, the split, p.
- A preference is not a verdict. Fewer than six decided answers mean little whatever the split.
