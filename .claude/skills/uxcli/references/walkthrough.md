# walkthrough — the four questions at every step

Read when: a journey has been walked and you need to know whether a person could follow it, not only
whether the page is built right. The metrics say how far, how long, how many; the walkthrough says
whether the person would know what to do. It is the method of Wharton, Rieman, Lewis & Polson (1994).

```bash
npx -y @junixlabs/uxcli walkthrough <journey> --as=<actor> --for=<person running you>   # one file per walk and persona
npx -y @junixlabs/uxcli walkthrough check
```

`--as` names an actor under `.uxcli/understanding/actors/`. Answer as that person — their contexts,
their pains, what is still unknown about them — never as a persona you imagined. Without `--as` you
answer as a first-time user of this screen.

## At each step, looking at its screenshot

| Question | Ask |
|---|---|
| `goal` | Is this what the person is trying to do at this point? |
| `notice` | Will they notice that the correct action is available? |
| `associate` | Will they connect that action with the effect they want? |
| `progress` | After the action, will they see that they are getting closer? |

Answer `yes`, `no` or `unsure`, with `why` (what on the screenshot makes it so) and, for `no` or
`unsure`, `where` (the element or region). Open the screenshot the card names; do not answer from the
source or from what you built.

## What check does

It refuses a step left out, an answer without why, a no without where, an actor nobody wrote, an
agent answering on nobody's behalf, and a `yes` the walk contradicts: `notice` where the control was
measured below the fold, `progress` where the step did not arrive or the screen took past a second to
settle. Every `no` and `unsure` is a finding in your words. None of it is a fail, and nobody was watched:
report findings as what a careful reviewer saw, not as what users do.
