# Transactions and forms — the `transaction` lens

Checkout, sign-up, booking, onboarding and multi-step forms: one task, completed once, correctly.

63 viewpoints from named designers. Answer every one for the screen you are looking at: `holds` with where, `breaks` with where and what, `n/a` with why. The sequence, the review file and `uxcli review check` are in `../references/lenses.md`. The rules are the designers', not uxcli's and not yours.

## 1. `usability.visibility-of-system-status`

Every action with consequences shows the user something changed, as quickly as possible, so they always know what the system is doing.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #1* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "The design should always keep users informed about what is going on, through appropriate feedback within a reasonable amount of time."
- **Do:** Show a visible trace of every state change; Give feedback immediately, or as quickly as possible; Disable and label a control while its action runs
- **Don't:** Submit silently; Change state with no visible trace; Show an action's result only somewhere else
- **Look at:** Drive an action, then diff DOM or pixels over the next frames: did anything visibly change within 1 s; is there a live region, status text, spinner or busy state?
- **Unless:** Below 0.1 s no special feedback is needed beyond showing the result
- **Also stated as:** modern.feedback-is-local-and-optimistic (Rauno Freiberg); writing.success-names-what-happened (Shopify Polaris); forms.do-not-disable-the-submit-button (GitHub Primer); feedback.status-messages-announced-without-focus (W3C Accessibility Guidelines Working Group); feedback.confirmation-page-says-what-happens-next (GOV.UK Design System).

## 2. `usability.fitts-target-size-and-distance`

Make targets big, space them apart, and put them where the pointer already is; touch targets at least 1 cm square.

- **Source:** Aurora Harley, NN/g, *Touch Targets on Touchscreens (2019)* — https://www.nngroup.com/articles/touch-target-size/ (study)
- **In their words:** "at least 1cm × 1cm (0.4in x 0.4in)"
- **Do:** Make targets big; Give icons labels so the label extends the target; Keep ample spacing between targets; Put the call to action near the final form fields
- **Don't:** Pack icon-only 24 px controls edge to edge on touch layouts; Crowd targets
- **Look at:** Bounding box of each interactive element at the mobile viewport (1 cm ≈ 38 CSS px; 24/44 px are the usual proxies); centre-to-centre spacing; distance from last input to submit; label inside the clickable box.
- **Unless:** Infinite targets along screen edges for mouse — size matters less at an edge; Primary CTAs, moving users, children and the elderly need larger than the minimum
- **Also stated as:** usability.hicks-fewer-choices-when-time-matters (Jon Yablonski (Laws of UX)); usability.peak-end-finish-well (Jon Yablonski (Laws of UX)); usability.von-restorff-one-emphasis (GOV.UK Design System); craft.growth-design-psychology-principles (Growth.Design (Dan Benoni, Louis-Xavier Lavallée)); modern.no-deceptive-patterns (Harry Brignull).

## 3. `usability.speak-the-users-language`

Write in the words the actor already uses; no internal jargon, error codes or unexplained abbreviations.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #2* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "The design should speak the users' language. Use words, phrases, and concepts familiar to the user, rather than internal jargon."
- **Do:** Use words the user understands without looking them up; Spell acronyms out in full on each page; Write 'for example', not 'eg' or 'ie'
- **Don't:** Show bare error codes; Expose internal entity names; Use unexplained abbreviations
- **Look at:** Flag bare error codes (e.g. ERR-422, Error 0x…), all-caps acronyms not defined on the page, and Latin abbreviations; whether a term is jargon for this actor needs the journey's actor.
- **Unless:** Expert-only tools where the domain term is the users' language — match the user, do not simplify per se
- **Also stated as:** writing.errors-say-what-and-how-to-fix (GOV.UK Design System (Government Digital Service)); writing.plain-language-reading-level (Shopify Polaris); forms.error-message-says-how-to-fix (GOV.UK Design System); modern.quality-is-a-choice-spec-is-the-floor (Karri Saarinen).

## 4. `usability.feedback-within-a-second`

Paint something within 0.1 s; keep the user's flow with a response under 1 s; show a progress indicator for anything longer.

- **Source:** Jakob Nielsen, *Response Times: The 3 Important Limits (1993)* — https://www.nngroup.com/articles/response-times-3-important-limits/ (study)
- **In their words:** "0.1 second is about the limit for having the user feel that the system is reacting instantaneously … 1.0 second is about the limit for the user's flow of thought to stay uninterrupted"
- **Do:** Use a progress indicator for any action over about 1 s; Use a looped indicator for 2–9 s waits; Use a percent-done indicator for 10 s or more
- **Don't:** Leave dead time with no indicator; Show a percent-done bar that lies badly
- **Look at:** Time from input event to first paint of any change; presence of a progress element, aria-busy, <progress> or role=status update when the wait exceeds 1 s.
- **Unless:** Laws of UX claims a purposeful delay can raise perceived value — an opinion with no study cited
- **Also stated as:** modern.interactions-feel-immediate-under-200ms (Rauno Freiberg); feedback.match-the-indicator-to-the-wait (GitHub Primer).

## 5. `usability.postel-tolerant-input`

Accept every reasonable form of an input — spaces, dashes, case, whitespace — and normalise it, instead of rejecting it.

- **Source:** Jon Yablonski (Laws of UX), *Postel's Law — Laws of UX* — https://lawsofux.com/postels-law/
- **In their words:** "Be liberal in what you accept, and conservative in what you send."
- **Do:** Accept variable input and translate it to your format; Normalise on blur; Define boundaries and give clear feedback
- **Don't:** Reject spaces or dashes in card or phone numbers; Reject leading or trailing whitespace in email; Treat email as case-sensitive; Force a date format the field could parse
- **Look at:** Drive each formatted field with equivalent variants ('4111 1111 1111 1111' vs '4111111111111111', ' a@b.co ', '+44 20…' vs '02…') and compare validation outcomes.
- **Unless:** Inputs where ambiguity is dangerous, such as dates in medical or legal contexts
- **Also stated as:** craft.body-16px-line-height-1-5 (Steve Schoger); modern.mobile-inputs-do-not-zoom-or-trap (Rauno Freiberg); forms.input-type-matches-the-answer (GOV.UK Design System).

## 6. `usability.clearly-marked-emergency-exit`

Every interaction has a visible, labelled way out — Cancel, Back, Escape, Undo — so a mistaken action does not trap the user.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #3* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "Users often perform actions by mistake. They need a clearly marked 'emergency exit' to leave the unwanted action without having to go through an extended process."
- **Do:** Support Undo and Redo; Show a clear Cancel or close control; Label the exit clearly and make it discoverable
- **Don't:** Open a modal with no close; Build a wizard step with no back; Ship a destructive action with no undo
- **Look at:** For each role=dialog or modal: a focusable control whose text or aria-label matches close/cancel/back, and Escape dismisses it; for each step past the first in a flow: a back control exists.
- **Unless:** Legally required interstitials — the exit must still be visible, not necessarily free of consequence
- **Also stated as:** forms.keep-answers-after-an-error (GOV.UK Design System); navigation.back-link-goes-one-step-back (GOV.UK Design System); navigation.breadcrumbs-only-for-real-hierarchy (GOV.UK Design System).

## 7. `usability.omit-needless-words`

Cut word count by half: no happy-talk intros, no instruction paragraphs before forms, no marketese, sentence case everywhere.

- **Source:** Jakob Nielsen, *How Users Read on the Web (1997)* — https://www.nngroup.com/articles/how-users-read-on-the-web/ (study)
- **In their words:** "People rarely read Web pages word by word; instead, they scan the page"
- **Do:** Reduce word count by half compared to traditional writing; Limit paragraphs to one idea each; Use sentence case everywhere except proper nouns
- **Don't:** Open with welcome or happy talk; Put instruction paragraphs before forms; Use promotional language ('marketese'); Set labels in ALL CAPS or Title Case
- **Look at:** Word count between a form's heading and its first input; word count of blocks starting 'Welcome' or 'Thank you for'; buttons and labels in all caps or Title Case; sentence count in instructions.
- **Unless:** Nielsen also asks for outbound links to build trust — brevity is not zero text
- **Also stated as:** writing.sentence-case-ui-text (IBM Carbon Design System).

## 8. `usability.fewer-checkout-fields`

Count fields, not steps: a guest checkout needs about eight, with optional fields collapsed behind links and billing defaulted to shipping.

- **Source:** Baymard Institute, *Checkout Optimization: minimize form fields (2024)* — https://baymard.com/blog/checkout-flow-average-form-fields (study)
- **In their words:** "The number of form fields in a checkout impacts overall usability far more than the number of steps."
- **Do:** Consolidate to a single 'Full Name' field; Hide Address Line 2 and the coupon field behind links; Default billing to shipping; Offer account creation after purchase
- **Don't:** Count steps as the metric; Show every optional field by default
- **Look at:** Count visible input, select and textarea across the checkout (excluding hidden and collapsed); optional fields shown expanded; separate first/last name fields; an open coupon field.
- **Unless:** Regulatory or fraud fields that genuinely cannot be defaulted; The minimum of 8 assumes a standard guest checkout
- **Also stated as:** forms.mark-optional-fields-in-words (GOV.UK Design System); forms.ask-only-what-you-need (GOV.UK Design System).

## 9. `usability.minimalist-no-competing-information`

Everything on the screen competes with the primary goal; remove what does not serve it so the main action stays visible.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #8* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "Every extra unit of information in an interface competes with the relevant units of information and diminishes their relative visibility."
- **Do:** Prioritise content and features that support the primary goal; Keep the primary action in the first viewport; Let the small screen force focus on what matters
- **Don't:** Let decorative elements distract; Let secondary content outweigh the primary action
- **Look at:** At 360 px: count distinct interactive elements above the fold; whether the journey's primary action is within the first viewport; count of elements sharing the accent colour.
- **Unless:** Dense expert dashboards where the irreducible information is large

## 10. `usability.no-false-affordances`

Nothing that is not interactive may look interactive: no underlined or blue static text, no button-shaped badges, no pointer cursor on inert elements.

- **Source:** Hoa Loranger, NN/g, *Beyond Blue Links: Making Clickable Elements Recognizable (2015)* — https://www.nngroup.com/articles/clickable-elements/
- **In their words:** "Avoid making non-clickable items (like headings) resemble buttons."
- **Do:** Reserve link colour and underline for links; Reserve button shape and fill for buttons
- **Don't:** Give static items hyperlink colours; Underline non-interactive text; Make headings or badges resemble buttons
- **Look at:** Elements with no href, handler, role or tabindex that have cursor: pointer, underline plus link colour, or a button-like box (border-radius, filled background, short centred text).
- **Also stated as:** canon.rams-honest (Dieter Rams).

## 11. `usability.help-in-context`

The best help is none; when a field needs explaining, put a short hint beside it at the moment it is needed, not on another page.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #10* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "Whenever possible, present the documentation in context right at the moment that the user requires it."
- **Do:** Use hint text for help relevant to most users; Keep hint text to one short sentence without full stops; Associate the hint with its input via aria-describedby
- **Don't:** Put help only on a separate page; Put links inside hint text; Write lengthy explanations
- **Look at:** For inputs with a format expectation (date, postcode, card): a hint associated via aria-describedby and rendered adjacent, same column, within one line-height; hint length in sentences.
- **Unless:** Nielsen's own first sentence: it is best if the system needs no additional explanation
- **Also stated as:** usability.placeholders-are-not-labels (Katie Sherwin, NN/g); forms.hint-text-is-short-and-linked (GOV.UK Design System).

## 12. `usability.signifiers-make-clickable-look-clickable`

Links and buttons must look clickable — colour, underline, border or fill — because weak signifiers cost measured time and fixations.

- **Source:** Kate Moran, NN/g, *Flat UI Elements Attract Less Attention and Cause Uncertainty (2017)* — https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/ (study)
- **In their words:** "22% more time"
- **Do:** Make links stand out from body text; Make buttons resemble physical buttons with rectangular shapes; Apply consistent treatment throughout the site; Provide signifiers rather than rely on affordances
- **Don't:** Style linked text as static text; Use ghost buttons as the default; Use disabled buttons if avoidable; Rely on a label to say that a control is a control
- **Look at:** For each a[href], button, [role=button]: computed colour, underline, border and background versus surrounding text; a link matching body colour with no underline and no other differentiator is weak; count disabled buttons.
- **Unless:** Link position in nav menus or peripheral lists may eliminate the need for underlining (Loranger); Flat works best with low information density, traditional layouts and high-contrast targets positioned standardly (Moran)
- **Also stated as:** modern.signifiers-survive-flatness (Kate Moran (NN/G)).

## 13. `usability.inline-validation-after-leaving-field`

Validate a hard field after the user leaves it, never on focus or while typing, and clear the error live once it is fixed.

- **Source:** Luke Wroblewski with Etre, *Inline Validation in Web Forms (A List Apart #291, 2009)* — https://alistapart.com/article/inline-validation-in-web-forms/ (study)
- **In their words:** "22% increase in success rates … 42% decrease in completion times … 47% decrease in eye fixations"
- **Do:** Validate on blur or when the input reaches its expected length; Re-check on each keystroke once an error shows and clear it when fixed; Keep success and error messages visible rather than fading; Reserve inline validation for hard fields like username and password
- **Don't:** Validate before and while typing; Show an error on focus of an empty field; Validate only on submit
- **Look at:** Drive a field: focus shows no error; typing an invalid value shows none (unless length threshold reached); blur shows an error adjacent via aria-describedby; typing a fix clears it without blur.
- **Unless:** Simple fields need none; premature validation was worse than none (Wroblewski)

## 14. `usability.progress-indication-in-flows`

In flows of three or more steps give some sense of position; do not assume a step bar helps — GOV.UK removed one with no effect.

- **Source:** Jon Yablonski (Laws of UX), *Goal-Gradient Effect — Laws of UX* — https://lawsofux.com/goal-gradient-effect/ (study)
- **In their words:** "The tendency to approach a goal increases with proximity to the goal."
- **Do:** Show a step or position label in long flows; Update the position between steps
- **Don't:** Leave a long wizard with no step label anywhere; Cite the Zeigarnik effect as the reason for a progress bar; Fake progress to manipulate
- **Look at:** Presence of a step or position element in flows with 3 or more steps, and whether it updates between steps.
- **Unless:** Short flows — GOV.UK's own guidance omits indicators by default; Artificial 'endowed progress' edges toward manipulation — flag, do not recommend

## 15. `usability.single-column-forms`

Forms run in one vertical column; only coherent entities like city/state/ZIP or card/expiry/CVV share a row.

- **Source:** Baymard Institute, *Form Field Usability: Avoid Extensive Multicolumn Layouts (2023)* — https://baymard.com/blog/avoid-multi-column-forms (study)
- **In their words:** "Use a single-column layout to support users' visual understanding of forms"
- **Do:** Keep one vertical path through the form; Allow a shared row only for a single coherent entity
- **Don't:** Lay out two independent question columns
- **Look at:** Cluster inputs by left x-coordinate; more than one column of independent inputs, not in the same fieldset or an allowed coherent row, fails.
- **Unless:** Coherent-entity rows: city/state/ZIP and card number/expiry/security code

## 16. `usability.aesthetic-usability-effect-bias`

Polish makes a screen look more usable than it is; discount your aesthetic impression and run the measurable checks first.

- **Source:** Kate Moran, NN/g, *The Aesthetic-Usability Effect (2024, rev. 2026)* — https://www.nngroup.com/articles/aesthetic-usability-effect/ (study)
- **In their words:** "Users' tendency to perceive attractive products as more usable. People tend to believe that things that look better will work better — even if they aren't actually more effective or efficient."
- **Do:** Rate your own screen after the measurable checks, not before; Treat polish as tolerance for minor problems only
- **Don't:** Read polish as usability; Let an attractive surface hide a usability problem
- **Look at:** Did the evaluator judge the screen usable because it looks good? Re-check the verdict against the count-kind entries before trusting it; 'attractive' is the variable and stays taste.
- **Unless:** With severe usability issues, or functionality sacrificed for aesthetics, users lose patience

## 17. `usability.natural-mapping-and-proximity`

Put a control next to the thing it changes and a label next to its field; gaps between groups must exceed gaps within them.

- **Source:** Marieke McCloskey, NN/g, *Form Design Quick Fix: Group Form Elements Effectively Using White Space (2013)* — https://www.nngroup.com/articles/form-design-white-space/
- **In their words:** "items near each other appear related"
- **Do:** Place labels as close to their fields as possible; Group related fields together; Place related targets close to each other; Put the call to action near the final form fields
- **Don't:** Put a control far from the thing it changes; Separate groups by less space than their members
- **Look at:** Distance from each label to its own input versus the nearest other input; gap within a fieldset versus gap between fieldsets; distance from last input to the submit button.
- **Unless:** Left-aligned labels are acceptable if space is constrained and labels are of similar length

## 18. `usability.labels-above-fields`

Stack the label above its field, left edges aligned, a few pixels apart, so label and field are read in one fixation.

- **Source:** Marieke McCloskey, NN/g, *Form Design Quick Fix: Group Form Elements Effectively Using White Space (2013)* — https://www.nngroup.com/articles/form-design-white-space/
- **In their words:** "users can see the text field in the same fixation as the label"
- **Do:** Top-align labels for familiar data like names, addresses and payment; Let users move in one direction: downward
- **Don't:** Put left labels far from their fields; Use right-justified labels with a ragged left edge; Put the label inside the field
- **Look at:** For each label/input pair: label box bottom ≤ input box top and label left edge ≈ input left edge within a few px; if side by side, the gap between label right edge and input left edge.
- **Unless:** Landscape phones: switch to left-aligned to keep the field visible above the keyboard (Baymard); Left-aligned is acceptable when labels are of similar length and as close to the fields as possible (NN/g)

## 19. `usability.field-width-matches-expected-input`

Size each input to the data it expects: short boxes for year, postcode and CVV; one consistent width for variable data like email.

- **Source:** Jamie Holst, Baymard Institute, *Form Field Usability: Matching User Expectations (2010)* — https://baymard.com/blog/form-field-usability-matching-user-expectations
- **In their words:** "Matching your customer's expectations – even when it comes to the subconscious expectations of how wide an input field should be – is crucial."
- **Do:** Fit fixed-length data with a width that matches it; Give variable common data one consistent width
- **Don't:** Make a CVV box as wide as an address line; Let a card-number field visibly truncate
- **Look at:** Rendered input width in ch of its font versus maxlength, inputmode, autocomplete token or pattern length: cc-csc wider than ~8 ch, postal-code at full width, or email narrower than ~20 ch.
- **Unless:** Full-width inputs on narrow phones are the norm — check at desktop widths or compare relative widths within the form

## 20. `usability.one-thing-per-page`

Split a public-facing form so each page asks one question, decision or piece of information, with eligibility questions first.

- **Source:** GOV.UK Service Manual, *Structuring forms (2018)* — https://www.gov.uk/service-manual/design/form-structure
- **In their words:** "Start by splitting the form across multiple pages with each page containing just one thing"
- **Do:** Ask one question per page; Start with questions that reveal ineligibility; Branch so people answer only relevant questions; Break complex tasks into smaller steps
- **Don't:** Put a long multi-section form in a public-facing transactional service
- **Look at:** Count distinct questions (label groups or fieldsets) per page in a flow; count required inputs per page.
- **Unless:** Be consistent, not uniform: internal expert tools and repeat users may prefer denser pages

## 21. `usability.dont-make-me-think`

A page's purpose and controls should be self-evident; nothing on it should raise a question the user must answer before acting.

- **Source:** Steve Krug, *Don't Make Me Think (2nd ed.), chapter 1 — Krug's First Law of Usability* — https://sensible.com/downloads/dmmt-toc.pdf
- **In their words:** "Don't make me think!"
- **Do:** Make the page's purpose obvious at a glance; Make every control self-evident
- **Don't:** Raise a question the user must answer before acting
- **Look at:** Look at the screen cold: is there anything you have to work out before you can act? The law is the sum of the other entries; a machine measures its symptoms, not the law.

## 22. `usability.start-with-user-needs-design-with-data`

Name the actor and their need before drawing a screen, then let measured behaviour, not hunches or looks, decide what changes.

- **Source:** GDS / GOV.UK, *Government Design Principles, principles 1, 3 and 4* — https://www.gov.uk/guidance/government-design-principles
- **In their words:** "Service design starts with identifying user needs. If you don't know what the user needs are, you won't build the right thing."
- **Do:** State the actor and need before the screen; Measure real behaviour; Start small and iterate
- **Don't:** Design to a hunch; Design to an aesthetic
- **Look at:** Does the journey name its actor and need (uxcli context show), and is the design decision traceable to observed behaviour rather than a hunch or a look?

## 23. `usability.constraints-shift-complexity-to-the-system`

Complexity that cannot be removed goes to the system, not the user: default what can be inferred, hide what is rarely needed.

- **Source:** Larry Tesler, via Jon Yablonski (Laws of UX), *Tesler's Law — Laws of UX* — https://lawsofux.com/teslers-law/ (secondary)
- **In their words:** "For any system there is a certain amount of complexity which cannot be reduced"
- **Do:** Set billing address equal to shipping by default; Hide Address Line 2 behind an expandable link; Collapse coupon code fields by default; Offer account creation after checkout completion
- **Don't:** Ask for what the system can infer or default; Show rarely used fields by default
- **Look at:** Count visible required inputs the page could default (no 'same as shipping' control, both address blocks open); presence of autocomplete tokens on address and payment inputs.
- **Unless:** Tognazzini's counter-view: users resist complexity reduction and attempt harder tasks when systems get simpler

## 24. `craft.fewer-borders`

Separate elements with space, a background shift, a shadow or striping before reaching for a border; too many borders make a design busy.

- **Source:** Adam Wathan & Steve Schoger, *Refactoring UI* — https://www.refactoringui.com/
- **In their words:** "Borders are a great way to distinguish two elements from one another, but using too many of them can make your design feel busy and cluttered."
- **Do:** Separate groups with space; Shift the background colour or add a shadow instead of a line; Zebra-stripe table rows instead of ruling them
- **Don't:** Use a 1px border as the default grouping device; Wrap a nav in a panel that only needs to recede; Rule every table row with a border when striping would do
- **Look at:** For every text node, count ancestors with a visible border, non-none box-shadow or outline; report max nesting depth and bordered boxes per viewport. Counted by `page.nesting`: `review check` refuses a `holds` it contradicts.
- **Unless:** Form inputs and the one object a person acts on keep their border; Keylines that make disconnected content feel connected; Decorative borders as style once the count is low
- **Also stated as:** canon.gestalt-common-region (Aurora Harley, NN/g); canon.rams-as-little-design-as-possible (Dieter Rams); modern.fewer-borders-more-space (Adam Wathan & Steve Schoger); canon.tufte-smallest-effective-difference (Edward Tufte); canon.tufte-one-plus-one-equals-three (Edward Tufte).

## 25. `craft.spacing-and-sizing-system`

Draw every margin, padding and gap from one scale, and make space between groups clearly larger than space within them.

- **Source:** Steve Schoger, *Little UI Details (tweet, 13 Jul 2017)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "Using multiples to define your spacing is a great way to achieve vertical rhythm and provides a formula to justify your choices"
- **Do:** Take spacing from a ladder of multiples of 4; Make between-group gaps larger than within-group gaps
- **Don't:** Use one-off values such as 13px or 27px; Use equal gaps across a group boundary
- **Look at:** Collect all computed margin, padding and gap values above 0; report distinct values and how many are off a 4px grid; compare label-to-field gap with field-to-next-label gap.
- **Unless:** Optical adjustments on icons and hanging punctuation sit a pixel or two off-scale
- **Also stated as:** canon.rams-thorough-to-the-last-detail (Dieter Rams); modern.radii-are-few-and-concentric (Vercel Labs); modern.spacing-comes-from-a-scale (Stan Kirilov).

## 26. `craft.wcag-contrast-and-dont-rely-on-colour-alone`

Meet 4.5:1 for body text and 3:1 for headlines, prefer soft backgrounds with dark text, and never convey status by colour alone.

- **Source:** Erik D. Kennedy, *100 Things a UX/UI Designer Should Know* — https://www.learnui.design/blog/100-things-ux-ui-designer-know.html
- **In their words:** "The WCAG recommended contrast ratio for body text — 4.5:1 to meet AA standards"
- **Do:** Style coloured badges as a soft background with dark text; Pair every colour state with an icon or label
- **Don't:** Set white text on yellow, green or red fills that fail 4.5:1; Convey status by colour only
- **Look at:** Standard contrast ratio of computed text colour against effective background at 4.5:1 or 3:1 by size; status elements must carry a non-colour signal such as text or an icon.
- **Unless:** Disabled controls; Logos; Incidental text, per WCAG itself
- **Also stated as:** modern.contrast-and-not-colour-alone (Apple); color.never-the-only-signal (W3C Accessibility Guidelines Working Group); feedback.message-type-said-in-words (U.S. Web Design System).

## 27. `craft.separation-order-space-then-lines-then-boxes`

Use the lightest separator that works: more space first, then a keyline or background band, and a box only for the object that is acted on.

- **Source:** Adam Wathan & Steve Schoger; Erik D. Kennedy, *Refactoring UI (fewer-borders tactic); 7 Rules for Creating Gorgeous UI, Part 1* — https://www.refactoringui.com/ (folklore: the wording is not verified)
- **Do:** Separate with whitespace by default; Add a keyline or background band only when space alone fails; Box only the object a person acts on
- **Don't:** Reach for a card or border first
- **Look at:** Between sibling groups, record which separator is used: gap at least 2x the inner gap (space), hr or border-bottom (line), bordered or shadowed wrapper (box); report the inner/outer gap ratio.
- **Unless:** Dense data such as tables where zebra stripes or keylines are used; Interactive cards that are the unit of action

## 28. `craft.button-hierarchy-one-primary`

One filled brand-colour button per view; secondaries outlined, tertiaries as text, destructive actions quiet with a confirmation step.

- **Source:** Steve Schoger, *Little UI Details (tweet, 2 Aug 2017)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "You want your primary button to stand out much more than your secondary / danger actions."
- **Do:** Fill exactly one button per view or dialog in the brand colour; Outline secondary actions and set tertiary actions as text; Keep destructive actions quiet unless they are the primary job
- **Don't:** Let a green button compete with the primary; Put a big red Delete beside a small Save; Colour every link brand blue
- **Look at:** Classify buttons as filled, outlined or text from computed style; fail if a view or dialog has more than one filled button of distinct hues, or a delete-labelled button is filled while the confirming action is not.
- **Unless:** Segmented or toggle groups; Toolbars of equal-weight actions; A page whose only job is the destructive action, where red is primary
- **Also stated as:** writing.destructive-actions-name-the-consequence (IBM Carbon Design System).

## 29. `craft.anything-but-dropdowns`

Before a dropdown, try a switch, segmented control, radios, cards, typeahead, calendar, text input or stepper.

- **Source:** Erik D. Kennedy, *4 Rules for Intuitive UX* — https://www.learnui.design/blog/4-rules-intuitive-ux.html
- **In their words:** "Any time you feel tempted to use a dropdown, ask yourself if one of these 12 controls is better instead. … dropdowns are pretty much the worst control."
- **Do:** Use a switch, checkbox or segmented button for two options; Use radios, segmented buttons or cards for two to five options; Use typeahead for long lists, a calendar or text input for dates, a stepper for counts
- **Don't:** Use a select for five or fewer options; Use three selects for a date; Ship a 195-country select without search on mobile
- **Look at:** For each select: fail at 5 or fewer options unless committed as a rarely changed default; fail 2–3 adjacent selects with day, month, year options; flag over 30 options at 375px with no typeahead.
- **Unless:** Users rarely need to change the default value; There are very few options; The user is not on mobile
- **Also stated as:** modern.boring-and-familiar-beats-novel (Scott Berkun); forms.memorable-dates-as-three-fields (GOV.UK Design System).

## 30. `craft.tap-targets-and-control-height`

Touch targets are at least 44×44; inputs and the buttons beside them share one height of 40 or 48px.

- **Source:** Erik D. Kennedy, *100 Things a UX/UI Designer Should Know* — https://www.learnui.design/blog/100-things-ux-ui-designer-know.html
- **In their words:** "The minimum tap target size on both iOS and Android — On iOS: 44x44pt. On Android: 48x48pt."
- **Do:** Give touch viewports hit areas of 44×44 or more; Match button height to the inputs beside it
- **Don't:** Use 26px-wide grid cells as targets; Make buttons shorter than the inputs they sit beside
- **Look at:** At 375px, getBoundingClientRect of every a, button, input and role=button: fail under 44 in width or height (under 24 for inline text links); in a form row, button and input heights within 2px.
- **Unless:** Inline text links in running prose; Dense desktop-only tools if the project commits to no touch
- **Also stated as:** modern.hit-targets-meet-platform-minimums (Apple).

## 31. `craft.type-scale-few-font-sizes`

Use about four font sizes from a fixed scale; reuse the default size for body, menus, lists and controls.

- **Source:** Erik D. Kennedy, *The Responsive Website Font Size Guidelines* — https://www.learnui.design/blog/mobile-desktop-website-font-size-guidelines.html
- **In their words:** "Even the most interaction-heavy pages can typically look just fine with about 4 font sizes total."
- **Do:** Use header, default, secondary (default minus 2px) and one wildcard size; Reuse the default size across body, menus, lists and controls
- **Don't:** Invent a new size per component; Apply a strict modular or golden-ratio scale to responsive pages
- **Look at:** Count distinct computed font-size values on visible text per viewport and how many fall outside the declared scale.
- **Unless:** Sizes must stay distinguishable, so large text may step many points apart; Marketing pages may add a display size
- **Also stated as:** canon.vignelli-two-type-sizes (Massimo Vignelli).

## 32. `craft.hierarchy-is-everything-squint-test`

Squint: the most important thing must catch the eye first and the least important last; one element dominates each screen.

- **Source:** Erik D. Kennedy, *4 Rules for Intuitive UX* — https://www.learnui.design/blog/4-rules-intuitive-ux.html
- **In their words:** "If you squint your eyes, the Most Important Thing should catch your eye first – and the least important elements should catch your eye last."
- **Do:** Give each screen one dominant element; Emphasize the most-used functionality; De-emphasize, hide or remove the rarely used
- **Don't:** Make the primary action grey and unnoticeable beside a bigger, brighter Help; Render two identical grey buttons where one is the main action
- **Look at:** Given a declared primary action, score every interactive element as area x contrast x font-weight factor; the declared primary must rank first, and no set of buttons may sit within 10% of each other.
- **Unless:** Page titles are the only element styled all-out up-pop; A browsing page such as a gallery may have no single most important thing

## 33. `craft.greys-dont-have-to-be-grey-never-use-black`

Tint the neutral scale toward the brand hue and never use pure black for text.

- **Source:** Steve Schoger, *Little UI Details (tweet, 19 Mar 2018)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "'Grey' doesn't have to mean Grey™. Try saturating your greys with a bit of blue or brown for a cooler or warmer feel."
- **Do:** Tint the grey scale toward the brand hue; Raise saturation at the light and dark ends of the scale
- **Don't:** Use #000 for text; Use pure zero-saturation greys as the whole neutral palette
- **Look at:** Count text, border and background colours with saturation 0 and lightness under 15%, and the share of neutral swatches with saturation exactly 0.
- **Unless:** It does not always work; worth a trial; High-contrast or accessibility modes and print

## 34. `craft.grids-are-overrated-content-dictates-width`

Let content dictate its own width and the layout follow; do not stretch components because the screen grew.

- **Source:** Erik D. Kennedy, *Why Beginning Designers Don't Need Grids, Type Scales, or Color Theory* — https://www.learnui.design/blog/why-beginning-designers-dont-need-grids-type-scales-color-theory.html
- **In their words:** "The hassle with grids is that they force the content into a specific width. Content should always dictate it's own width … and the layout should follow suit."
- **Do:** On mobile align to three rulers: 16px left, centre, 16px right; Keep content at fixed sizes such as a 72px thumbnail
- **Don't:** Stretch every element wider because the phone got wider; Size components by percentage so they shrink below their content's need
- **Look at:** At 360–414px viewport, every content edge sits at 16px (or one consistent gutter) from the viewport edge and nothing overflows horizontally.
- **Unless:** Strict grids for posters and websites where the artistry of the composition matters more than the information

## 35. `canon.bringhurst-leading-is-a-rhythmic-unit`

The leading is the vertical unit; add and remove vertical space in multiples of it.

- **Source:** Robert Bringhurst, *The Elements of Typographic Style §2.2.1 / §2.2.2 (via webtypography.net)* — http://webtypography.net/2.2.1
- **In their words:** "You must choose not only the overall measure – the depth of the column or page – but also a basic rhythmical unit. This unit is the leading, which is the distance from one baseline to the next."
- **Do:** Use a unitless line-height such as 1.5; Make vertical margins multiples of the line-height
- **Don't:** Vertical spacing unrelated to the line unit; Line-height below 1 on running text
- **Look at:** Body line-height L; margins and paddings between text blocks as multiples of L (or L/2 if the lens allows).
- **Unless:** More leading for longer measures, darker faces, larger x-height and sans serifs: the ratio moves with the face

## 36. `canon.butterick-emphasis-sparingly`

One emphasis device at a time: bold or italic, never both; underline only links; caps only under one line and tracked.

- **Source:** Matthew Butterick, *Practical Typography, Summary of key rules* — https://practicaltypography.com/summary-of-key-rules.html
- **In their words:** "Use bold or italic as little as possible, and not together."
- **Do:** Bold-only headings; Caps only on one-line labels with 5–12% tracking; Underline only on links
- **Don't:** Bold italic; Underlined non-links; All-caps paragraphs; Centred body text
- **Look at:** Elements with font-weight ≥600 and italic; underline on non-anchors; uppercase on blocks rendering more than one line; centred multi-line paragraphs; uppercase runs with letter-spacing under 0.05em.
- **Unless:** Underline for web links; All caps under one line of text

## 37. `modern.motion-values-proportional-to-trigger`

Scale and fade motion starts near its resting size, in proportion to the trigger, never from zero or a heavy squash.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "Don't animate dialog scale in from 0 → 1, fade opacity and scale from ~0.8. Don't scale buttons on press from 1 → 0.8, but ~0.96, ~0.9, or so."
- **Do:** Enter dialogs and popovers from scale 0.8–0.97 with opacity; Press buttons to about scale 0.96–0.97
- **Don't:** Scale-from-zero pops on dialogs; Press states that squash a button to 0.8 or below
- **Look at:** Parse @keyframes and WAAPI keyframes on dialogs, popovers and buttons and read the starting scale(); :active transforms below about 0.9 fail.
- **Unless:** Elements that genuinely originate from a point, such as a FAB expanding into a sheet, can grow from small
- **Also stated as:** feedback.motion-duration-scales-with-size (IBM Carbon Design System).

## 38. `modern.defaults-are-decisions-you-inherited`

A library or AI default is someone else's decision; commit to one written aesthetic direction instead of inheriting it.

- **Source:** hipuku, *The Default Is Not a Design Decision* — https://www.hipuku.dev/writing/the-default-is-not-a-design-decision
- **In their words:** "The default was always a design decision. Someone made it upstream, and everyone who builds on top inherits it without asking why."
- **Do:** A written token set such as DESIGN.md; One committed aesthetic direction; Semantic colour
- **Don't:** Untouched library defaults; Clean and modern as a brief; The AI-look constellation of purple gradient, Inter, identical cards, glass glow and bounce hover
- **Look at:** Score the constellation: purple-to-blue/cyan gradients warn, Inter or Roboto with no display face notes, 3+ identical icon+h3+p cards note, backdrop-filter plus glow notes, gradient text on numerals warns, overshoot cubic-bezier on hover warns.
- **Unless:** A purple brand is allowed to be purple; the tell is the constellation and the absence of a decision, not any one colour
- **Also stated as:** craft.supercharge-the-defaults (Steve Schoger (attendee notes by ynotdraw)).

## 39. `modern.readable-type-sizes-and-weights`

Body text sits at the platform default size, weights stay 400 or heavier, and weight never changes on hover.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "Font weights below 400 should not be used"
- **Do:** 17px body on touch, 13px minimum on desktop UI; Weights between 400 and 700; Headings at weight 500–600; Minimise the number of typefaces
- **Don't:** Body text under 11pt; font-weight 300 or lower; Weight swaps on hover or selected state
- **Look at:** Computed font-size and font-weight of every text node at a phone viewport; count distinct font-family stacks and warn above 2.
- **Unless:** Captions and legal text may sit at the platform minimum; Display headings may use light weights at large sizes

## 40. `modern.every-state-is-designed`

Empty, sparse, dense, error and loading states are designed; skeletons match final layout and long content never overflows.

- **Source:** Vercel Labs, *Web Interface Guidelines — AGENTS.md* — https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/AGENTS.md
- **In their words:** "MUST: Design empty/sparse/dense/error states"
- **Do:** An empty state with a primary create action; Skeletons sized like real rows; min-w-0 and truncation on flex children
- **Don't:** Blank screens on empty arrays; Spinners that reflow content; Overflow from long strings
- **Look at:** Render with [], with 1 item, with 500 items and with a 300-character title; assert no horizontal overflow, no overlap, an actionable control in the empty state, and skeleton-to-loaded CLS under a threshold.

## 41. `modern.numbers-and-text-do-not-shift-layout`

Numbers in columns and timers use tabular figures, images carry dimensions, and nothing changes weight on hover.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "tabular figures should be applied with `font-variant-numeric: tabular-nums`, particularly in tables or when layout shifts are undesirable, like in timers"
- **Do:** tabular-nums in tables, timers and prices; width and height on every img
- **Don't:** Proportional digits in columns; Images without dimensions; Weight changes on hover
- **Look at:** Numeric td cells whose computed font-variant-numeric lacks tabular-nums; img without width/height or aspect-ratio; sibling rect drift while a counter fixture runs.
- **Unless:** Prose numbers
- **Also stated as:** data-display.right-align-numbers-tabular-figures (GitHub Primer).

## 42. `modern.delight-scales-with-rarity`

Spend delight on rare moments, keep daily actions plain, and never let an element visibly duplicate itself during a transition.

- **Source:** Benji Taylor, *Family Values* — https://benji.org/family-values
- **In their words:** "the potential for delight increases as the frequency of feature usage decreases"
- **Do:** Directional motion between tabs; Morphing labels such as Continue to Confirm; One action per tray
- **Don't:** Static jumps on core flows; Theatrical motion on daily actions; An element visibly duplicated mid-transition
- **Look at:** After a transition, count DOM nodes with the same key or text present twice on screen at once; frequency-weighted motion needs the journey to say what is frequent.
- **Unless:** Utility, performance and security come first; delight is selective emphasis

## 43. `modern.animate-only-transform-and-opacity`

Animate only transform and opacity, listing properties explicitly; never transition all or animate layout properties.

- **Source:** Emil Kowalski, *Great Animations* — https://emilkowal.ski/ui/great-animations
- **In their words:** "you should try to animate with `transform` and `opacity` as they only trigger the third rendering step (composite)"
- **Do:** Prefer CSS, then WAAPI, then JS for motion; Use clip-path for reveals; List transitioned properties explicitly
- **Don't:** transition: all; Animating width, height, top, left, margin or padding; Large blur() values on filter or backdrop-filter in motion
- **Look at:** Scan stylesheets and computed transition-property for all and for layout properties; scan @keyframes for width, height, top and left.
- **Unless:** Accordion height animation via grid-template-rows or interpolate-size is layout by nature and accepted when it is the only honest way

## 44. `modern.focus-is-visible-and-unobscured`

Every focusable element shows a visible focus ring on :focus-visible, and no sticky or fixed element ever covers it.

- **Source:** Vercel Labs, *Web Interface Guidelines — AGENTS.md* — https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/AGENTS.md
- **In their words:** "NEVER: `outline: none` without visible focus replacement"
- **Do:** Style :focus-visible with box-shadow or outline plus outline-offset
- **Don't:** outline: none or 0 with no replacement; Focus rings hidden under sticky headers
- **Look at:** Tab through every focusable element; diff the focused and unfocused rect or read computed outline and box-shadow under :focus-visible; check the focused rect is not intersected by position fixed or sticky elements above it.

## 45. `color.status-colours-keep-their-meaning`

Each status colour has one meaning across the product (critical for errors and blocked actions, warning for what needs attention, success for what went well, info for tips) and is never borrowed for promotion or decoration.

- **Source:** Shopify Polaris, *Colors: Palettes and roles (Critical, Success)* — https://polaris.shopify.com/design/colors/palettes-and-roles
- **In their words:** "Elements using critical must convey messaging that implies that an action is impossible, blocked, or has resulted in an error."
- **Do:** Map error, warning, success and info to named roles or tokens and use them only in those roles; Reserve the critical red for errors, blocked actions and destructive buttons; Use the info role, not warning or critical, for tips and announcements
- **Don't:** A sale or 'new' badge in the error red; Success green used to entice or to advertise an offer; Warning colour for 'coming soon' or 'under construction' messaging; Two different reds meaning error on different screens
- **Look at:** Find the colour the page uses for error text (an element with role=alert, aria-invalid's described-by message, or a class/token named error/critical/danger) and the success colour likewise. Count painted elements (text, fill or border) whose colour equals that error or success colour, within a ΔE of 3, and that are neither a validation message, an invalid field, a status badge of that meaning, nor a destructive action.
- **Unless:** Brand colours that happen to be red, as long as a separate, distinct error red is used for errors; Data visualisations where a series colour coincides with a status hue but no status is implied (prefer avoiding it)

## 46. `color.from-tokens-not-hex`

Every colour on the page comes from the design system's named tokens or palette functions, never from hex values copied into components.

- **Source:** GOV.UK Design System (Government Digital Service), *Styles: Colour* — https://design-system.service.gov.uk/styles/colour/
- **In their words:** "Do not copy the specific hexadecimal (hex) colour values."
- **Do:** Reference colour by role token (brand, text, error, border) rather than by value; Use palette colours (tints and shades of a few families) for supporting elements; Use a functional token only in the context it is designed for
- **Don't:** Hex literals in component styles; Near-duplicate colours (#1d70b8 next to #1d70b9) created by eye-dropping; Using the error token as a general red
- **Look at:** Collect every computed color, background-color, border-*-color, outline-color and fill/stroke of painted elements, and every value of CSS custom properties declared on :root (and on any theme selector). Count distinct painted colours that match no custom-property value (exact RGBA after resolution), and count pairs of painted colours closer than ΔE 2 that are not identical.
- **Unless:** Images, illustrations and embedded third-party widgets; Browser defaults on unstyled native controls; GOV.UK: palette colours (not functional ones) are allowed for illustrations and custom components

## 47. `color.one-action-colour-apart-from-status`

Links and primary actions share one interactive colour family, used consistently, and that colour is not the colour of errors, warnings or success.

- **Source:** IBM Carbon Design System, *Elements: Color, Overview (Color anatomy)* — https://carbondesignsystem.com/elements/color/overview/
- **In their words:** "The core blue family serves as the primary action color across all IBM products and experiences. Additional colors are used sparingly and purposefully."
- **Do:** One link colour, used only for links; Primary buttons in the brand or action colour; Danger colour reserved for destructive buttons, not for the primary action
- **Don't:** Links in the error red; Primary buttons in several different hues across screens; Static text coloured like links
- **Look at:** Take the computed text colour of every a[href] in running text and the background of every primary (first, filled, or type=submit) button. Count distinct hues among them (30° bins), and count links or primary buttons whose colour is within ΔE 10 of the page's error, warning or success colour. Also count non-interactive text elements painted in the link colour.
- **Unless:** Primer (GitHub) deliberately uses the success role for primary buttons; a system that states such a mapping consistently is following its own rule; Destructive primary actions (Delete account) take the danger colour on purpose; Navigation menus, where position signals the link

## 48. `color.controls-and-graphics-3-to-1`

The parts that show a control is there and what state it is in (input borders, checkbox boxes and ticks, toggle tracks, icon-only buttons, meaningful chart marks) contrast at least 3:1 with the colours next to them.

- **Source:** W3C Accessibility Guidelines Working Group, *Understanding Success Criterion 1.4.11: Non-text Contrast (WCAG 2.2)* — https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- **In their words:** "Unless the control is inactive, any visual information provided that is necessary for a user to identify that a control is present and how to operate it must have a minimum 3:1 contrast ratio with the adjacent colors."
- **Do:** Input borders at 3:1 against the background the input sits on, or a filled input background at 3:1; Checkbox ticks and radio dots at 3:1 against the box; Standalone icons at 3:1 against their background; Avoid very thin lines that anti-alias below the nominal ratio
- **Don't:** Pale grey input borders (#ddd on white is about 1.4:1); A selected state shown only by a faint tint; Hover effects that lower a control's contrast with its surroundings
- **Look at:** For each visible input, select, textarea, checkbox, radio, [role=switch] and icon-only button (no visible text): compute the contrast ratio between the colour that identifies it (border colour, or its own background when it has no border, or the icon fill) and the background behind it; count those below 3:1, unrounded. Disabled controls are skipped.
- **Unless:** Inactive (disabled) controls are exempt; A control identified by its visible text needs no contrasting boundary; Logos and decorative graphics; Appearance determined by the browser and not modified by the author

## 49. `color.focus-ring-contrasts-with-its-surroundings`

The focus indicator contrasts at least 3:1 with whatever it is drawn against: the page background for an outer ring, the component's own colours for an inner one.

- **Source:** W3C Accessibility Guidelines Working Group, *Understanding Success Criterion 1.4.11: Non-text Contrast, Relationship with Focus Visible (WCAG 2.2)* — https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- **In their words:** "In combination with 2.4.7 Focus Visible, the visual focus indicator for a component must have sufficient contrast against the adjacent background when the component is focused, except where the appearance of the component is determined by the user agent and not modified by the author."
- **Do:** An outer ring that contrasts with the page background; A two-colour ring (dark and light) that holds on any background; A thick indicator rather than a 1px one
- **Don't:** A yellow outer ring on a white page; A focus border that changes hue inside the component without contrasting with its fill; Focus shown only by a background tint change
- **Look at:** Tab to each focusable control; diff the focused and unfocused screenshots of the control's box padded by a few pixels; for the changed pixels, take their colour and the colour of the unchanged pixels adjacent to them (page background outside, component fill inside). Count controls where no changed region reaches 3:1 against its adjacent colour. page.focus-visible checks only that some pixel changes; this checks that the change can be seen.
- **Unless:** Unmodified browser default focus styles; WCAG does not compare focused and unfocused states with each other; a background-only change is out of scope for 1.4.11 but fails Use of Color

## 50. `color.few-families-in-proportion`

Use a few colour families in a deliberate proportion (neutral base dominant, then primary, secondary and a small accent), not an even spread of many hues.

- **Source:** U.S. Web Design System (GSA), *Design tokens: Theme color tokens* — https://designsystem.digital.gov/design-tokens/color/theme-tokens/
- **In their words:** "about 60% of your site’s color would be the primary color family, about 30% would be the secondary color family, and about 10% would be the accent color families"
- **Do:** Neutral base for text and most surfaces; One primary family carrying most of the colour, one secondary, a small accent; Additional colours used sparingly and for a purpose (Carbon); Start in black and white, then add colour to support the message (USWDS)
- **Don't:** Five or more saturated hue families at similar weight on one screen; An accent that covers more area than the primary; A new hue introduced for a single component
- **Look at:** Screenshot the page and bucket every non-neutral pixel (HSL saturation above about 15%) by hue into 30° bins, ignoring images and status colours. How many hue families take more than 2% of the coloured area, and does the largest one carry most of it while the smallest (accent) stays near a tenth?
- **Unless:** USWDS: the proportions are for non-base colours; neutral text will usually dominate; Illustration, photography and data visualisation, which need their own palettes; Brands whose identity is multi-hue

## 51. `writing.buttons-name-the-action`

A button's label is a verb (plus its object when needed) that says what happens when it is pressed; vague labels like OK, Done, Submit or Yes are replaced whenever a specific action exists.

- **Source:** IBM Carbon Design System, *Dialog pattern, anatomy: Actions* — https://carbondesignsystem.com/patterns/dialog-pattern/
- **In their words:** "Use descriptive words for the actions like Add, Delete, Save and avoid vague words like Done or OK."
- **Do:** Start the label with a verb: 'Save and continue', 'Send invoice', 'Add product'; Name the object when the verb alone is ambiguous on that screen; Make the dialog title and its confirming button use the same verb
- **Don't:** 'OK', 'Done', 'Submit', 'Yes', 'Go', 'Confirm' where a specific action exists; Labels that describe the button rather than the action ('Button', 'Click'); Icon-only buttons without an accessible name
- **Look at:** List every visible button and input[type=submit] with its accessible name. Count those whose trimmed, lower-cased name is in the generic set {ok, okay, done, submit, yes, go, confirm, click here, click, button} or is empty. Count must be 0 outside of a platform-standard alert with a single acknowledgement.
- **Unless:** A purely informational alert with one acknowledgement button may say 'OK'; GOV.UK uses 'Continue' for a question page that does not save the user's answers — a convention for multi-page forms, not a generic label

## 52. `writing.one-label-per-action`

One concept, one word: controls that do the same thing carry the same label everywhere, and controls that do different things never share a label.

- **Source:** GitHub Primer, *Accessibility guide: Descriptive buttons, 'How to test names'* — https://primer.style/guides/accessibility/descriptive-buttons
- **In their words:** "When buttons perform the same action, they have the same name."
- **Do:** Keep a terminology list of preferred words and words not to use for the product; Pick one verb per action (Delete or Remove, not both for the same thing) and reuse it across pages; Add the object to disambiguate repeated actions ('Remove Apples', 'Remove Pears')
- **Don't:** Synonyms for one action across screens: 'Save' here, 'Update' there, 'Apply' elsewhere; Identical labels for different actions on the same page; Naming the same object two ways ('workspace' and 'project') in one product
- **Look at:** Across the journey's pages, collect (accessible name, action) pairs for buttons and links, where action is the form action/href/handler target. Count names that map to two or more different actions on one page, and actions reached by two or more different names across pages; also flag known synonym pairs present together (save/update/apply, delete/remove, sign in/log in, cart/basket). Count must be 0.
- **Unless:** Delete and Remove may coexist when they mean different things (destroy vs take out of a collection), as Carbon defines them — then each must be used only for its own meaning

## 53. `writing.dates-numbers-units-for-the-reader`

Dates spell out the month, numbers are numerals with thousands separators, and units sit a space after their number — formatted in the reader's locale, never as an ambiguous all-numeric date or a raw machine value.

- **Source:** Shopify Polaris, *Content: Grammar and mechanics, 'Numbers, dates, and currency'* — https://polaris.shopify.com/content/grammar-and-mechanics
- **In their words:** "Use the month’s full name. If there isn’t enough space, use 3-letter abbreviations. Don’t write dates with numerals only."
- **Do:** 'December 11, 2024' or 'Dec 11, 2024' (in the reader's locale order); Numerals, not words: 'You have 5 orders to fulfill'; Thousands separators: '12,000'; A space between number and unit: '3.4 lb', '2 kg'; Currency code after the amount when currencies can be confused: '$10,000 USD'; Format with Intl.DateTimeFormat / Intl.NumberFormat for the user's locale
- **Don't:** All-numeric dates like '12/11/24'; ISO timestamps or epoch values shown raw ('2024-12-11T09:30:00Z'); Ordinals in dates ('January 23rd'); Unit glued to the number ('3.4lb'); Shortened numbers like '12 k' where the exact value matters
- **Look at:** Scan visible text nodes. Count matches of all-numeric dates (\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b), raw ISO timestamps (\d{4}-\d{2}-\d{2}T\d{2}:), integers of 5+ digits with no separator outside codes/IDs, and numbers glued to a unit (\d(kg|lb|cm|mm|km|mi|ml|oz)\b). Count must be 0.
- **Unless:** Polaris notes these are American English base rules and dates, numbers and measurements should be localized automatically — the target is the reader's locale, not US format; Identifiers, codes, SKUs and years are not quantities and take no separator; Dense data tables may use compact numeric dates if the format is unambiguous for the locale and stated in the column header

## 54. `data-display.text-left-headers-follow-their-column`

Text cells are left-aligned, nothing in a data table is centred, and each column header takes the same alignment as the data below it.

- **Source:** W3C WAI (Eric Eggert, Shadi Abou-Zahra, eds.), *Tables Tutorial — Tips and Tricks: Alignment* — https://www.w3.org/WAI/tutorials/tables/tips/
- **In their words:** "Align text to the left and numeric data to the right (in left-to-right languages), so that people using larger text sizes or smaller screens will be able to find it. … It’s helpful to give column headers the same alignment as the data in the cells below."
- **Do:** Left-align (start-align) textual cells and their headers; Give each th the same horizontal alignment as the cells of its column; Mirror alignment in right-to-left languages
- **Don't:** Centre-aligned text or number columns; A left-aligned header above a right-aligned numeric column; Centred headers as a table-wide default
- **Look at:** For each table column: count th whose computed text-align differs from the dominant text-align of the td in the same column, and count td/th whose computed text-align is center (excluding cells that hold only a checkbox, icon or status badge).
- **Unless:** A column holding only a checkbox, icon or single glyph may be centred; Right-to-left scripts reverse the sides

## 55. `data-display.no-tables-for-layout`

A table is for comparing data in rows and columns, never for arranging content on the page; layout belongs to the grid.

- **Source:** GOV.UK Design System (Government Digital Service), *Table — When not to use this component* — https://design-system.service.gov.uk/components/table/
- **In their words:** "Never use the table component to layout content on a page."
- **Do:** CSS grid or flex for page and dashboard layout; A list, cards or a summary list for items that do not share columns; Tables only where every row has the same fields
- **Don't:** A table that positions a sidebar, form or dashboard tiles; Table cells holding headings, paragraphs or whole forms; role=presentation on a table that actually holds tabular data
- **Look at:** Count table elements that have no th and either contain headings, more than one paragraph per cell, form fieldsets or nested tables, or have a single row whose cells hold unrelated content blocks.
- **Unless:** HTML email, where tables are still the only reliable layout tool

## 56. `data-display.summary-list-for-key-value-facts`

A set of facts about one thing — label and value pairs — is shown as a summary list (dl with dt and dd), not as a table with no headers or as loose text.

- **Source:** GOV.UK Design System (Government Digital Service), *Summary list — When to use / When not to use this component* — https://design-system.service.gov.uk/components/summary-list/
- **In their words:** "Use a summary list to show information as a list of key facts. … only use it to present information that has a key and at least one value."
- **Do:** dl with dt (the key) and dd (the value) for record details, metadata and check-your-answers pages; A row action ('Change') whose accessible name includes the key ('Change name'); Headings or cards to separate several summary lists on one page
- **Don't:** A two-column table without th used to show one record's fields; Key–value pairs set as 'Label: value' runs in a paragraph; A summary list for genuinely tabular data or a plain list of items
- **Look at:** Where the screen shows the fields of a single record (a profile, an order, an item's metadata, a check-answers page), are the label–value pairs marked up as dl/dt/dd with each key visually distinct from its value — and is tabular data comparing several records in a table rather than a summary list?
- **Unless:** Two or three facts inside a card may be inline text if they are not scanned as a set

## 57. `forms.error-summary-at-the-top`

After a failed submit, show an error summary at the top of the page that takes focus and links each error to its field — even when there is only one error.

- **Source:** GOV.UK Design System, *Error summary component* — https://design-system.service.gov.uk/components/error-summary/
- **In their words:** "Always show an error summary when there is a validation error, even if there’s only one."
- **Do:** A summary above the h1 (below any back link) with a heading such as 'There is a problem'; Move keyboard focus to the summary when it appears; One link per error, pointing at the field (or the first field of a date or radio group); Word each summary item exactly like the message beside its field; Prefix the page <title> with 'Error: '
- **Don't:** Errors shown only beside fields far down a long form, with focus left on the submit button; A summary of plain text with no links to the fields; A toast or banner that disappears before it can be read
- **Look at:** Submit the form empty. Within 1 s: is there an element above the first h1 of main that has focus (document.activeElement inside it), contains one link per invalid field, and does each link's href resolve to the id of an invalid input? Does document.title start with 'Error'?
- **Unless:** Primer suggests the interactive summary only for 3 or more errors, and otherwise focusing the first invalid field; A one-field form (search, single email sign-up) can rely on the message beside the field

## 58. `forms.group-related-inputs-in-a-fieldset`

Wrap each set of inputs that answer one question — radios, checkboxes, a date, an address — in a fieldset whose first child is a legend naming the question.

- **Source:** U.S. Web Design System (USWDS), *Form component — Accessibility guidance* — https://designsystem.digital.gov/components/form/
- **In their words:** "Group each set of thematically related controls in a fieldset element. Use the legend element to offer a label within each one."
- **Do:** fieldset + legend for every radio group and checkbox group; fieldset + legend for date (day/month/year) and multi-line address; The legend as the page h1 when the page asks only that question; '(optional)' in the legend when the whole group is optional
- **Don't:** A radio group whose question is a <p> or <div> above the radios; Radio and checkbox groups with no group name for assistive tech; A fieldset with no legend or an empty one
- **Look at:** Count radio groups (same name), checkbox groups, and day/month/year triples. How many are not inside a fieldset whose first element child is a non-empty legend (or a role=group / radiogroup with aria-labelledby pointing at visible text)?
- **Unless:** A single checkbox (I agree) needs no fieldset; Native fieldset/legend can be replaced by role=group with aria-labelledby where styling requires it

## 59. `forms.validate-when-the-user-is-done`

Do not show an error while the user is still typing; validate when they try to continue, and only add earlier validation where research shows it helps.

- **Source:** GOV.UK Design System, *Recover from validation errors pattern — When to tell the user about validation errors* — https://design-system.service.gov.uk/patterns/validation/
- **In their words:** "Generally speaking, avoid validating the information in a field before the user has finished entering it. This sort of validation can cause problems - especially for users who type more slowly."
- **Do:** Validate on Continue or Submit; After a failed submit, update a field's error live once the user fixes it (Primer); A character count is the accepted exception: warn as the limit is passed
- **Don't:** An error that appears on the first keystroke of an email or phone field; Red borders on an untouched form at load; Browser-native HTML5 validation bubbles in place of designed messages
- **Look at:** Focus an email or formatted field and type one character, keeping focus. Wait 1 s. Does any error message, aria-invalid=true or error colour appear before blur or submit? Also load the form fresh: are any fields already marked invalid?
- **Unless:** GOV.UK goes further and says not to validate on blur either; Baymard (usability.inline-validation-after-leaving-field) recommends blur validation for hard fields — the schools agree only on 'not while typing'; Primer allows validating as the user types once the field has already been flagged invalid, so the error clears as soon as it is fixed

## 60. `forms.autocomplete-names-the-purpose`

Every field that asks about the user — name, email, phone, address, postcode, birthday, card — carries the matching autocomplete token so browsers and assistive tech can fill and label it.

- **Source:** W3C Web Accessibility Initiative, *Understanding WCAG 2.2 Success Criterion 1.3.5: Identify Input Purpose* — https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html
- **In their words:** "Use code to indicate the purpose of common inputs, where technology allows."
- **Do:** autocomplete='name' or 'given-name' and 'family-name' on name fields; 'email', 'tel', 'postal-code', 'street-address' or 'address-line1', 'bday-day'/'bday-month'/'bday-year'; 'shipping' and 'billing' section tokens on order forms; autocomplete='off' on the form, if needed, while each field still declares its purpose
- **Don't:** autocomplete='off' on personal fields with no purpose token; Personal-data fields with no autocomplete attribute; A token that does not match the field (email token on a phone field)
- **Look at:** For every input, select and textarea whose label matches name, email, phone, address, postcode/ZIP, city, country, date of birth, card number or expiry: count those whose autocomplete attribute is missing, 'off', or not a WCAG input-purpose token that matches the label.
- **Unless:** Fields about someone other than the user (a recipient's email) are outside 1.3.5; A field that accepts either username or email may carry one token or none

## 61. `navigation.skip-link-is-the-first-tab-stop`

The first Tab press on every page lands on a visible 'Skip to main content' link that moves focus past the header and navigation into main.

- **Source:** GOV.UK Design System, *Skip link component* — https://design-system.service.gov.uk/components/skip-link/
- **In their words:** "Including the skip link component gives users the option to bypass the top-level navigation links and jump to the main content on a page."
- **Do:** The skip link immediately after <body> (or after a cookie banner); Visually hidden until it receives keyboard focus, then clearly shown; A target id on <main> (or its first heading) that can take focus; Breadcrumbs and back links placed before <main>, so the skip link skips them too
- **Don't:** A page whose first Tab stop is the logo or the first of a dozen nav links; A skip link that stays invisible when focused; A skip link whose href points at an id that does not exist; A skip link wrapped in <nav> or moved inside the header
- **Look at:** Load the page and press Tab once: is document.activeElement an <a> whose href is '#id' of an element that is main or inside main, with a non-zero box inside the viewport and opacity above 0? Press Enter, then Tab: is focus on an element inside main?
- **Unless:** WCAG 2.4.1 is met by other means too (landmarks, headings); the first-Tab test follows GOV.UK and Carbon practice and is stricter than the criterion; WCAG: when the repeated navigation is at the bottom of the page, a skip link may be unnecessary; A page with no repeated block before main (a bare single-purpose page) has nothing to skip

## 62. `feedback.time-limits-warn-and-extend`

When a session or form times out, the user is warned before it happens and can extend it with a simple action, given at least 20 seconds to respond, or the limit can be turned off or lengthened.

- **Source:** W3C Accessibility Guidelines Working Group, *Understanding Success Criterion 2.2.1: Timing Adjustable (WCAG 2.2)* — https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html
- **In their words:** "Providing options to disable time limits, customize the length of time limits, or request more time before a time limit occurs helps those users who require more time than expected to successfully complete tasks."
- **Do:** No time limit where none is needed; A warning dialog before expiry, announced and focused, with 'Stay signed in' as the primary action; At least 20 seconds to respond to the warning; extending possible at least ten times; After a time-out, the user's answers kept so they can continue once signed in again
- **Don't:** Silent session expiry that discards a half-filled form; A timed redirect ('You will be taken to the home page in 5 seconds') with no way to stop it; A warning that appears only as a toast or banner outside the user's focus
- **Look at:** With the clock accelerated (or the session TTL shortened) on each authenticated or multi-step page, leave the page idle until the time limit. Count limits that expire with no prior warning; warnings that give less than 20 s between appearing and expiry; warnings with no keyboard-reachable control that extends the session; meta refresh or JavaScript redirects that fire on a timer with no control to stop them; and expiries after which previously entered field values are lost. Count must be 0.
- **Unless:** Real-time events such as auctions, and limits that are essential or longer than 20 hours, are exempt; Security limits such as one-time codes can be essential, but other criteria (redundant entry, accessible authentication) still apply; Answers being kept after a time-out comes from WCAG 2.2.5 Re-authenticating (AAA), referenced from this page, not from 2.2.1 itself

## 63. `feedback.toasts-carry-nothing-critical`

A toast is only for a short, low-priority confirmation of something the user just did; an error that needs action, a warning, or anything the user cannot find again elsewhere goes in an inline message or banner that stays.

- **Source:** Shopify Polaris, *Toast component — Accessibility* — https://polaris.shopify.com/components/deprecated/toast
- **In their words:** "Avoid using toast for critical information that merchants need to act on immediately."
- **Do:** Short noun + verb confirmations: 'Product updated', 'Collection added'; Errors the user must fix shown next to the cause or in a banner that persists until resolved; Whatever the toast says also visible somewhere on the page after it goes (the saved value, the item in the list, a notifications area)
- **Don't:** A validation or payment error delivered only as a toast that auto-dismisses; A toast that holds the only copy of a generated password, link or code; Several sentences of explanation in a toast
- **Look at:** Record a walk through every action, including forced failures (offline, 4xx, 5xx). Treat as a toast any fixed- or absolute-positioned element with role=status|alert or aria-live that is removed or hidden within 15 s without user input. Count toasts whose text matches error/failed/could not/denied/invalid, toasts with more than 15 words, and toasts whose distinctive text (any token of 6+ characters other than common words) appears nowhere in the DOM 2 s after they leave. Count must be 0.
- **Unless:** Polaris allows an error toast for system errors not caused by the user, such as 'Internet disconnected', in 3 words; Polaris's own Toast component is deprecated in favour of the App Bridge Toast API; the guidance quoted is still on its page; The 15 s, 15-word and 6-character thresholds are uxcli's
