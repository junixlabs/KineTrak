# Workspace and admin — the `workspace` lens

Admin, CRUD, tables, settings and B2B tools: repeated work where speed and consistency matter.

67 viewpoints from named designers. Answer every one for the screen you are looking at: `holds` with where, `breaks` with where and what, `n/a` with why. The sequence, the review file and `uxcli review check` are in `../references/lenses.md`. The rules are the designers', not uxcli's and not yours.

## 1. `usability.visibility-of-system-status`

Every action with consequences shows the user something changed, as quickly as possible, so they always know what the system is doing.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #1* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "The design should always keep users informed about what is going on, through appropriate feedback within a reasonable amount of time."
- **Do:** Show a visible trace of every state change; Give feedback immediately, or as quickly as possible; Disable and label a control while its action runs
- **Don't:** Submit silently; Change state with no visible trace; Show an action's result only somewhere else
- **Look at:** Drive an action, then diff DOM or pixels over the next frames: did anything visibly change within 1 s; is there a live region, status text, spinner or busy state?
- **Unless:** Below 0.1 s no special feedback is needed beyond showing the result
- **Also stated as:** modern.feedback-is-local-and-optimistic (Rauno Freiberg); modern.density-is-value-per-time-and-space (Matthew Ström-Awn); writing.success-names-what-happened (Shopify Polaris); data-display.loading-skeleton-holds-the-layout (GitHub Primer); forms.do-not-disable-the-submit-button (GitHub Primer); feedback.status-messages-announced-without-focus (W3C Accessibility Guidelines Working Group).

## 2. `usability.feedback-within-a-second`

Paint something within 0.1 s; keep the user's flow with a response under 1 s; show a progress indicator for anything longer.

- **Source:** Jakob Nielsen, *Response Times: The 3 Important Limits (1993)* — https://www.nngroup.com/articles/response-times-3-important-limits/ (study)
- **In their words:** "0.1 second is about the limit for having the user feel that the system is reacting instantaneously … 1.0 second is about the limit for the user's flow of thought to stay uninterrupted"
- **Do:** Use a progress indicator for any action over about 1 s; Use a looped indicator for 2–9 s waits; Use a percent-done indicator for 10 s or more
- **Don't:** Leave dead time with no indicator; Show a percent-done bar that lies badly
- **Look at:** Time from input event to first paint of any change; presence of a progress element, aria-busy, <progress> or role=status update when the wait exceeds 1 s.
- **Unless:** Laws of UX claims a purposeful delay can raise perceived value — an opinion with no study cited
- **Also stated as:** modern.interactions-feel-immediate-under-200ms (Rauno Freiberg).

## 3. `usability.speak-the-users-language`

Write in the words the actor already uses; no internal jargon, error codes or unexplained abbreviations.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #2* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "The design should speak the users' language. Use words, phrases, and concepts familiar to the user, rather than internal jargon."
- **Do:** Use words the user understands without looking them up; Spell acronyms out in full on each page; Write 'for example', not 'eg' or 'ie'
- **Don't:** Show bare error codes; Expose internal entity names; Use unexplained abbreviations
- **Look at:** Flag bare error codes (e.g. ERR-422, Error 0x…), all-caps acronyms not defined on the page, and Latin abbreviations; whether a term is jargon for this actor needs the journey's actor.
- **Unless:** Expert-only tools where the domain term is the users' language — match the user, do not simplify per se
- **Also stated as:** writing.errors-say-what-and-how-to-fix (GOV.UK Design System (Government Digital Service)); writing.plain-language-reading-level (Shopify Polaris); forms.error-message-says-how-to-fix (GOV.UK Design System); modern.quality-is-a-choice-spec-is-the-floor (Karri Saarinen).

## 4. `usability.clearly-marked-emergency-exit`

Every interaction has a visible, labelled way out — Cancel, Back, Escape, Undo — so a mistaken action does not trap the user.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #3* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "Users often perform actions by mistake. They need a clearly marked 'emergency exit' to leave the unwanted action without having to go through an extended process."
- **Do:** Support Undo and Redo; Show a clear Cancel or close control; Label the exit clearly and make it discoverable
- **Don't:** Open a modal with no close; Build a wizard step with no back; Ship a destructive action with no undo
- **Look at:** For each role=dialog or modal: a focusable control whose text or aria-label matches close/cancel/back, and Escape dismisses it; for each step past the first in a flow: a back control exists.
- **Unless:** Legally required interstitials — the exit must still be visible, not necessarily free of consequence
- **Also stated as:** craft.button-hierarchy-one-primary (Steve Schoger); writing.destructive-actions-name-the-consequence (IBM Carbon Design System); feedback.destructive-actions-confirmed-or-undoable (U.S. Web Design System); feedback.toast-actions-wait-for-the-user (Shopify Polaris).

## 5. `usability.signifiers-make-clickable-look-clickable`

Links and buttons must look clickable — colour, underline, border or fill — because weak signifiers cost measured time and fixations.

- **Source:** Kate Moran, NN/g, *Flat UI Elements Attract Less Attention and Cause Uncertainty (2017)* — https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/ (study)
- **In their words:** "22% more time"
- **Do:** Make links stand out from body text; Make buttons resemble physical buttons with rectangular shapes; Apply consistent treatment throughout the site; Provide signifiers rather than rely on affordances
- **Don't:** Style linked text as static text; Use ghost buttons as the default; Use disabled buttons if avoidable; Rely on a label to say that a control is a control
- **Look at:** For each a[href], button, [role=button]: computed colour, underline, border and background versus surrounding text; a link matching body colour with no underline and no other differentiator is weak; count disabled buttons.
- **Unless:** Link position in nav menus or peripheral lists may eliminate the need for underlining (Loranger); Flat works best with low information density, traditional layouts and high-contrast targets positioned standardly (Moran)
- **Also stated as:** modern.signifiers-survive-flatness (Kate Moran (NN/G)); modern.no-dead-zones-and-honest-clickability (Rauno Freiberg).

## 6. `usability.omit-needless-words`

Cut word count by half: no happy-talk intros, no instruction paragraphs before forms, no marketese, sentence case everywhere.

- **Source:** Jakob Nielsen, *How Users Read on the Web (1997)* — https://www.nngroup.com/articles/how-users-read-on-the-web/ (study)
- **In their words:** "People rarely read Web pages word by word; instead, they scan the page"
- **Do:** Reduce word count by half compared to traditional writing; Limit paragraphs to one idea each; Use sentence case everywhere except proper nouns
- **Don't:** Open with welcome or happy talk; Put instruction paragraphs before forms; Use promotional language ('marketese'); Set labels in ALL CAPS or Title Case
- **Look at:** Word count between a form's heading and its first input; word count of blocks starting 'Welcome' or 'Thank you for'; buttons and labels in all caps or Title Case; sentence count in instructions.
- **Unless:** Nielsen also asks for outbound links to build trust — brevity is not zero text
- **Also stated as:** writing.sentence-case-ui-text (IBM Carbon Design System).

## 7. `usability.fitts-target-size-and-distance`

Make targets big, space them apart, and put them where the pointer already is; touch targets at least 1 cm square.

- **Source:** Aurora Harley, NN/g, *Touch Targets on Touchscreens (2019)* — https://www.nngroup.com/articles/touch-target-size/ (study)
- **In their words:** "at least 1cm × 1cm (0.4in x 0.4in)"
- **Do:** Make targets big; Give icons labels so the label extends the target; Keep ample spacing between targets; Put the call to action near the final form fields
- **Don't:** Pack icon-only 24 px controls edge to edge on touch layouts; Crowd targets
- **Look at:** Bounding box of each interactive element at the mobile viewport (1 cm ≈ 38 CSS px; 24/44 px are the usual proxies); centre-to-centre spacing; distance from last input to submit; label inside the clickable box.
- **Unless:** Infinite targets along screen edges for mouse — size matters less at an edge; Primary CTAs, moving users, children and the elderly need larger than the minimum
- **Also stated as:** craft.tap-targets-and-control-height (Erik D. Kennedy); modern.hit-targets-meet-platform-minimums (Apple).

## 8. `usability.natural-mapping-and-proximity`

Put a control next to the thing it changes and a label next to its field; gaps between groups must exceed gaps within them.

- **Source:** Marieke McCloskey, NN/g, *Form Design Quick Fix: Group Form Elements Effectively Using White Space (2013)* — https://www.nngroup.com/articles/form-design-white-space/
- **In their words:** "items near each other appear related"
- **Do:** Place labels as close to their fields as possible; Group related fields together; Place related targets close to each other; Put the call to action near the final form fields
- **Don't:** Put a control far from the thing it changes; Separate groups by less space than their members
- **Look at:** Distance from each label to its own input versus the nearest other input; gap within a fieldset versus gap between fieldsets; distance from last input to the submit button.
- **Unless:** Left-aligned labels are acceptable if space is constrained and labels are of similar length
- **Also stated as:** canon.gestalt-proximity (Aurora Harley, NN/g).

## 9. `usability.follow-conventions`

Work the way the sites and platforms users already know; a convention beats a locally optimised novelty.

- **Source:** Jakob Nielsen, *OK-Cancel or Cancel-OK? (2008)* — https://www.nngroup.com/articles/ok-cancel-or-cancel-ok/
- **In their words:** "Following platform conventions is more important than optimizing an individual dialog box."
- **Do:** Keep button order identical in every dialog; Highlight the most common button as default, except for dangerous actions; Prefer descriptive labels over 'OK'; Let users keep a familiar version for a while when changing
- **Don't:** Invent a new pattern for a solved problem; Vary the same control's placement between screens
- **Look at:** Logo in header links home; a search input has type=search or a search label; primary/secondary button order is the same in every dialog; cart and account icons stay where they were on other screens.
- **Unless:** Desktop apps follow their own OS: Windows OK-first, Apple OK-last
- **Also stated as:** craft.anything-but-dropdowns (Erik D. Kennedy); modern.boring-and-familiar-beats-novel (Scott Berkun).

## 10. `usability.help-in-context`

The best help is none; when a field needs explaining, put a short hint beside it at the moment it is needed, not on another page.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #10* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "Whenever possible, present the documentation in context right at the moment that the user requires it."
- **Do:** Use hint text for help relevant to most users; Keep hint text to one short sentence without full stops; Associate the hint with its input via aria-describedby
- **Don't:** Put help only on a separate page; Put links inside hint text; Write lengthy explanations
- **Look at:** For inputs with a format expectation (date, postcode, card): a hint associated via aria-describedby and rendered adjacent, same column, within one line-height; hint length in sentences.
- **Unless:** Nielsen's own first sentence: it is best if the system needs no additional explanation
- **Also stated as:** usability.placeholders-are-not-labels (Katie Sherwin, NN/g); forms.hint-text-is-short-and-linked (GOV.UK Design System).

## 11. `usability.inline-validation-after-leaving-field`

Validate a hard field after the user leaves it, never on focus or while typing, and clear the error live once it is fixed.

- **Source:** Luke Wroblewski with Etre, *Inline Validation in Web Forms (A List Apart #291, 2009)* — https://alistapart.com/article/inline-validation-in-web-forms/ (study)
- **In their words:** "22% increase in success rates … 42% decrease in completion times … 47% decrease in eye fixations"
- **Do:** Validate on blur or when the input reaches its expected length; Re-check on each keystroke once an error shows and clear it when fixed; Keep success and error messages visible rather than fading; Reserve inline validation for hard fields like username and password
- **Don't:** Validate before and while typing; Show an error on focus of an empty field; Validate only on submit
- **Look at:** Drive a field: focus shows no error; typing an invalid value shows none (unless length threshold reached); blur shows an error adjacent via aria-describedby; typing a fix clears it without blur.
- **Unless:** Simple fields need none; premature validation was worse than none (Wroblewski)

## 12. `usability.no-false-affordances`

Nothing that is not interactive may look interactive: no underlined or blue static text, no button-shaped badges, no pointer cursor on inert elements.

- **Source:** Hoa Loranger, NN/g, *Beyond Blue Links: Making Clickable Elements Recognizable (2015)* — https://www.nngroup.com/articles/clickable-elements/
- **In their words:** "Avoid making non-clickable items (like headings) resemble buttons."
- **Do:** Reserve link colour and underline for links; Reserve button shape and fill for buttons
- **Don't:** Give static items hyperlink colours; Underline non-interactive text; Make headings or badges resemble buttons
- **Look at:** Elements with no href, handler, role or tabindex that have cursor: pointer, underline plus link colour, or a button-like box (border-radius, filled background, short centred text).

## 13. `usability.von-restorff-one-emphasis`

One visually distinct primary action per view, left-aligned with the form, and distinguished by more than colour.

- **Source:** GOV.UK Design System, *Button component* — https://design-system.service.gov.uk/components/button/
- **In their words:** "Avoid using multiple default buttons on a single page. Having more than one main call to action reduces their impact, and makes it harder for users to know what to do next."
- **Do:** Make key actions visually distinctive; Use restraint so emphases do not compete; Align the primary button to the left edge of the form; Highlight the default, except for dangerous actions
- **Don't:** Put two or more filled primary buttons in one view; Signal emphasis by colour alone
- **Look at:** Cluster interactive elements by computed background, border and weight; the most emphatic cluster per view must have one member; primary's left edge aligns with the inputs; emphasis differs in weight, fill or border, not colour only.
- **Unless:** Do not pre-highlight a dangerous action as the default (Nielsen)

## 14. `usability.aesthetic-usability-effect-bias`

Polish makes a screen look more usable than it is; discount your aesthetic impression and run the measurable checks first.

- **Source:** Kate Moran, NN/g, *The Aesthetic-Usability Effect (2024, rev. 2026)* — https://www.nngroup.com/articles/aesthetic-usability-effect/ (study)
- **In their words:** "Users' tendency to perceive attractive products as more usable. People tend to believe that things that look better will work better — even if they aren't actually more effective or efficient."
- **Do:** Rate your own screen after the measurable checks, not before; Treat polish as tolerance for minor problems only
- **Don't:** Read polish as usability; Let an attractive surface hide a usability problem
- **Look at:** Did the evaluator judge the screen usable because it looks good? Re-check the verdict against the count-kind entries before trusting it; 'attractive' is the variable and stays taste.
- **Unless:** With severe usability issues, or functionality sacrificed for aesthetics, users lose patience

## 15. `usability.postel-tolerant-input`

Accept every reasonable form of an input — spaces, dashes, case, whitespace — and normalise it, instead of rejecting it.

- **Source:** Jon Yablonski (Laws of UX), *Postel's Law — Laws of UX* — https://lawsofux.com/postels-law/
- **In their words:** "Be liberal in what you accept, and conservative in what you send."
- **Do:** Accept variable input and translate it to your format; Normalise on blur; Define boundaries and give clear feedback
- **Don't:** Reject spaces or dashes in card or phone numbers; Reject leading or trailing whitespace in email; Treat email as case-sensitive; Force a date format the field could parse
- **Look at:** Drive each formatted field with equivalent variants ('4111 1111 1111 1111' vs '4111111111111111', ' a@b.co ', '+44 20…' vs '02…') and compare validation outcomes.
- **Unless:** Inputs where ambiguity is dangerous, such as dates in medical or legal contexts

## 16. `usability.labels-above-fields`

Stack the label above its field, left edges aligned, a few pixels apart, so label and field are read in one fixation.

- **Source:** Marieke McCloskey, NN/g, *Form Design Quick Fix: Group Form Elements Effectively Using White Space (2013)* — https://www.nngroup.com/articles/form-design-white-space/
- **In their words:** "users can see the text field in the same fixation as the label"
- **Do:** Top-align labels for familiar data like names, addresses and payment; Let users move in one direction: downward
- **Don't:** Put left labels far from their fields; Use right-justified labels with a ragged left edge; Put the label inside the field
- **Look at:** For each label/input pair: label box bottom ≤ input box top and label left edge ≈ input left edge within a few px; if side by side, the gap between label right edge and input left edge.
- **Unless:** Landscape phones: switch to left-aligned to keep the field visible above the keyboard (Baymard); Left-aligned is acceptable when labels are of similar length and as close to the fields as possible (NN/g)

## 17. `usability.field-width-matches-expected-input`

Size each input to the data it expects: short boxes for year, postcode and CVV; one consistent width for variable data like email.

- **Source:** Jamie Holst, Baymard Institute, *Form Field Usability: Matching User Expectations (2010)* — https://baymard.com/blog/form-field-usability-matching-user-expectations
- **In their words:** "Matching your customer's expectations – even when it comes to the subconscious expectations of how wide an input field should be – is crucial."
- **Do:** Fit fixed-length data with a width that matches it; Give variable common data one consistent width
- **Don't:** Make a CVV box as wide as an address line; Let a card-number field visibly truncate
- **Look at:** Rendered input width in ch of its font versus maxlength, inputmode, autocomplete token or pattern length: cc-csc wider than ~8 ch, postal-code at full width, or email narrower than ~20 ch.
- **Unless:** Full-width inputs on narrow phones are the norm — check at desktop widths or compare relative widths within the form

## 18. `usability.start-with-user-needs-design-with-data`

Name the actor and their need before drawing a screen, then let measured behaviour, not hunches or looks, decide what changes.

- **Source:** GDS / GOV.UK, *Government Design Principles, principles 1, 3 and 4* — https://www.gov.uk/guidance/government-design-principles
- **In their words:** "Service design starts with identifying user needs. If you don't know what the user needs are, you won't build the right thing."
- **Do:** State the actor and need before the screen; Measure real behaviour; Start small and iterate
- **Don't:** Design to a hunch; Design to an aesthetic
- **Look at:** Does the journey name its actor and need (uxcli context show), and is the design decision traceable to observed behaviour rather than a hunch or a look?

## 19. `usability.constraints-shift-complexity-to-the-system`

Complexity that cannot be removed goes to the system, not the user: default what can be inferred, hide what is rarely needed.

- **Source:** Larry Tesler, via Jon Yablonski (Laws of UX), *Tesler's Law — Laws of UX* — https://lawsofux.com/teslers-law/ (secondary)
- **In their words:** "For any system there is a certain amount of complexity which cannot be reduced"
- **Do:** Set billing address equal to shipping by default; Hide Address Line 2 behind an expandable link; Collapse coupon code fields by default; Offer account creation after checkout completion
- **Don't:** Ask for what the system can infer or default; Show rarely used fields by default
- **Look at:** Count visible required inputs the page could default (no 'same as shipping' control, both address blocks open); presence of autocomplete tokens on address and payment inputs.
- **Unless:** Tognazzini's counter-view: users resist complexity reduction and attempt harder tasks when systems get simpler

## 20. `craft.fewer-borders`

Separate elements with space, a background shift, a shadow or striping before reaching for a border; too many borders make a design busy.

- **Source:** Adam Wathan & Steve Schoger, *Refactoring UI* — https://www.refactoringui.com/
- **In their words:** "Borders are a great way to distinguish two elements from one another, but using too many of them can make your design feel busy and cluttered."
- **Do:** Separate groups with space; Shift the background colour or add a shadow instead of a line; Zebra-stripe table rows instead of ruling them
- **Don't:** Use a 1px border as the default grouping device; Wrap a nav in a panel that only needs to recede; Rule every table row with a border when striping would do
- **Look at:** For every text node, count ancestors with a visible border, non-none box-shadow or outline; report max nesting depth and bordered boxes per viewport. Counted by `page.nesting`: `review check` refuses a `holds` it contradicts.
- **Unless:** Form inputs and the one object a person acts on keep their border; Keylines that make disconnected content feel connected; Decorative borders as style once the count is low
- **Also stated as:** canon.gestalt-common-region (Aurora Harley, NN/g); forms.group-related-inputs-in-a-fieldset (U.S. Web Design System (USWDS)); modern.fewer-borders-more-space (Adam Wathan & Steve Schoger); modern.cards-are-a-choice-not-a-default (Stan Kirilov); canon.tufte-one-plus-one-equals-three (Edward Tufte); craft.separation-order-space-then-lines-then-boxes (Adam Wathan & Steve Schoger; Erik D. Kennedy).

## 21. `craft.dont-overlook-empty-states-teach-by-example`

Design the first-load and empty states with sample data or an example, a message and a call to action; never a blank page.

- **Source:** Erik D. Kennedy, *4 Rules for Intuitive UX* — https://www.learnui.design/blog/4-rules-intuitive-ux.html
- **In their words:** "Use the 'first load' experience to provide sample data, showing by example what the properly-working app will look like"
- **Do:** Show a designed empty state with message, example and call to action; Seed sample data on first load; Show examples rather than descriptions
- **Don't:** Show a totally blank page on first load; Show a table header with no rows and no message
- **Look at:** In the journey's declared empty state, find list or table containers with 0 data children; require a visible sentence inside or adjacent and at least one actionable element.
- **Unless:** Zero-hit search results need a message but no sample data; Transient loading states
- **Also stated as:** modern.every-state-is-designed (Vercel Labs); writing.empty-states-say-what-next (GitHub Primer); data-display.empty-data-explains-and-offers-next-step (IBM Carbon Design System); data-display.wrap-before-truncating-and-reveal-the-rest (GitHub Primer); feedback.match-the-indicator-to-the-wait (GitHub Primer).

## 22. `craft.spacing-and-sizing-system`

Draw every margin, padding and gap from one scale, and make space between groups clearly larger than space within them.

- **Source:** Steve Schoger, *Little UI Details (tweet, 13 Jul 2017)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "Using multiples to define your spacing is a great way to achieve vertical rhythm and provides a formula to justify your choices"
- **Do:** Take spacing from a ladder of multiples of 4; Make between-group gaps larger than within-group gaps
- **Don't:** Use one-off values such as 13px or 27px; Use equal gaps across a group boundary
- **Look at:** Collect all computed margin, padding and gap values above 0; report distinct values and how many are off a 4px grid; compare label-to-field gap with field-to-next-label gap.
- **Unless:** Optical adjustments on icons and hanging punctuation sit a pixel or two off-scale
- **Also stated as:** canon.rams-thorough-to-the-last-detail (Dieter Rams); modern.radii-are-few-and-concentric (Vercel Labs); modern.spacing-comes-from-a-scale (Stan Kirilov).

## 23. `craft.wcag-contrast-and-dont-rely-on-colour-alone`

Meet 4.5:1 for body text and 3:1 for headlines, prefer soft backgrounds with dark text, and never convey status by colour alone.

- **Source:** Erik D. Kennedy, *100 Things a UX/UI Designer Should Know* — https://www.learnui.design/blog/100-things-ux-ui-designer-know.html
- **In their words:** "The WCAG recommended contrast ratio for body text — 4.5:1 to meet AA standards"
- **Do:** Style coloured badges as a soft background with dark text; Pair every colour state with an icon or label
- **Don't:** Set white text on yellow, green or red fills that fail 4.5:1; Convey status by colour only
- **Look at:** Standard contrast ratio of computed text colour against effective background at 4.5:1 or 3:1 by size; status elements must carry a non-colour signal such as text or an icon.
- **Unless:** Disabled controls; Logos; Incidental text, per WCAG itself
- **Also stated as:** modern.contrast-and-not-colour-alone (Apple); color.never-the-only-signal (W3C Accessibility Guidelines Working Group); navigation.you-are-here (U.S. Web Design System (USWDS)); feedback.message-type-said-in-words (U.S. Web Design System).

## 24. `craft.align-with-readability-in-mind`

Keep few strong left edges, right-align comparable numbers with tabular figures, and hang punctuation so edges line up.

- **Source:** Steve Schoger, *Little UI Details (tweet, 15 Jun 2017)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "Aligning text is an easy way to clean up your design and make your content much more scannable."
- **Do:** Keep few, strong left edges; Right-align numeric columns with tabular figures; Hang bullets, icons and punctuation so text edges align
- **Don't:** Align a right-aligned image to ragged left-aligned text; Centre columns of numbers
- **Look at:** Count distinct left-edge x positions of text blocks in a container at 1px tolerance; for td cells matching a number or currency pattern, text-align must be right or end and tabular figures must be set.
- **Unless:** IDs, ZIP codes and phone numbers stay left-aligned; Centred layouts under 3 lines
- **Also stated as:** data-display.right-align-numbers-tabular-figures (GitHub Primer); data-display.text-left-headers-follow-their-column (W3C WAI (Eric Eggert, Shadi Abou-Zahra, eds.)).

## 25. `craft.hierarchy-is-everything-squint-test`

Squint: the most important thing must catch the eye first and the least important last; one element dominates each screen.

- **Source:** Erik D. Kennedy, *4 Rules for Intuitive UX* — https://www.learnui.design/blog/4-rules-intuitive-ux.html
- **In their words:** "If you squint your eyes, the Most Important Thing should catch your eye first – and the least important elements should catch your eye last."
- **Do:** Give each screen one dominant element; Emphasize the most-used functionality; De-emphasize, hide or remove the rarely used
- **Don't:** Make the primary action grey and unnoticeable beside a bigger, brighter Help; Render two identical grey buttons where one is the main action
- **Look at:** Given a declared primary action, score every interactive element as area x contrast x font-weight factor; the declared primary must rank first, and no set of buttons may sit within 10% of each other.
- **Unless:** Page titles are the only element styled all-out up-pop; A browsing page such as a gallery may have no single most important thing

## 26. `craft.greys-dont-have-to-be-grey-never-use-black`

Tint the neutral scale toward the brand hue and never use pure black for text.

- **Source:** Steve Schoger, *Little UI Details (tweet, 19 Mar 2018)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "'Grey' doesn't have to mean Grey™. Try saturating your greys with a bit of blue or brown for a cooler or warmer feel."
- **Do:** Tint the grey scale toward the brand hue; Raise saturation at the light and dark ends of the scale
- **Don't:** Use #000 for text; Use pure zero-saturation greys as the whole neutral palette
- **Look at:** Count text, border and background colours with saturation 0 and lightness under 15%, and the share of neutral swatches with saturation exactly 0.
- **Unless:** It does not always work; worth a trial; High-contrast or accessibility modes and print

## 27. `craft.type-scale-few-font-sizes`

Use about four font sizes from a fixed scale; reuse the default size for body, menus, lists and controls.

- **Source:** Erik D. Kennedy, *The Responsive Website Font Size Guidelines* — https://www.learnui.design/blog/mobile-desktop-website-font-size-guidelines.html
- **In their words:** "Even the most interaction-heavy pages can typically look just fine with about 4 font sizes total."
- **Do:** Use header, default, secondary (default minus 2px) and one wildcard size; Reuse the default size across body, menus, lists and controls
- **Don't:** Invent a new size per component; Apply a strict modular or golden-ratio scale to responsive pages
- **Look at:** Count distinct computed font-size values on visible text per viewport and how many fall outside the declared scale.
- **Unless:** Sizes must stay distinguishable, so large text may step many points apart; Marketing pages may add a display size

## 28. `canon.rams-understandable`

The structure of the product should be visible and its controls legible without instruction.

- **Source:** Dieter Rams, *Ten principles for good design* — https://www.vitsoe.com/us/about/good-design
- **In their words:** "Good design makes a product understandable. It clarifies the product's structure. Better still, it can make the product talk. At best, it is self-explanatory."
- **Do:** Show structure with headings per region; Give every control a visible name; Put a text label on the primary action
- **Don't:** Rely on tooltips as the only explanation; Ship icon-only controls without a visible label; Require a manual
- **Look at:** Interactive elements with no accessible name; icon-only controls without a visible text label; landmark regions with no heading.
- **Unless:** Rams's own products rely on convention rather than labels everywhere; the rule is about structure, not text density
- **Also stated as:** modern.no-junk-drawer-menus-or-unlabeled-icons (Jakob Nielsen (NN/G)); writing.buttons-name-the-action (IBM Carbon Design System); navigation.primary-nav-visible-on-wide-screens (GitHub Primer); usability.dont-make-me-think (Steve Krug); navigation.top-level-is-sections-not-a-site-map (GOV.UK Design System); craft.labels-are-a-last-resort (Steve Schoger (attendee notes by ynotdraw)).

## 29. `canon.rams-as-little-design-as-possible`

Remove everything that does not serve the purpose; less, but better.

- **Source:** Dieter Rams, *Ten principles for good design* — https://www.vitsoe.com/us/about/good-design
- **In their words:** "Good design is as little design as possible. Less, but better – because it concentrates on the essential aspects, and the products are not burdened with non-essentials."
- **Do:** Remove anything that does not serve the purpose; Keep one border where one will do
- **Don't:** Add ornament or decoration for its own sake; Repeat the heading as a decorative icon; Wrap content in extra bordered or shadowed layers
- **Look at:** Decorative-only elements (no text, image or interactive role, only border/shadow/background) and distinct box-shadow, border-radius and gradient declarations in computed styles.
- **Unless:** Aesthetic quality is part of usefulness (principle 3): stripping to nothing is not the goal

## 30. `canon.vignelli-syntactic-consistency`

The same type, grid and spacing relationships repeat from screen to screen across the whole project.

- **Source:** Massimo Vignelli, *The Vignelli Canon, Syntactics (p.12)* — https://www.rit.edu/vignellicenter/sites/rit.edu.vignellicenter/files/documents/The%20Vignelli%20Canon.pdf
- **In their words:** "The consistency of a design is provided by the appropriate relationship of the various syntactical elements of the project: how type relates to grids and images from page to page throughout the whole project."
- **Do:** Reuse one set of font sizes, families, column edges and heading margins on every screen
- **Don't:** Let each screen invent its own type or grid relationship
- **Look at:** Per-screen fingerprint across a journey: set of font-sizes, font-families, column edges, heading margins; diff between screens.
- **Also stated as:** writing.one-label-per-action (GitHub Primer); navigation.same-navigation-on-every-page (W3C WAI).

## 31. `canon.tufte-smallest-effective-difference`

Make every visual distinction as subtle as it can be while still reading clearly.

- **Source:** Edward Tufte, *Visual Explanations (1997), p.73* — https://boxesandarrows.com/three-lessons-from-tufte-special-deliverable-6/ (secondary)
- **In their words:** "Make all visual distinctions as subtle as possible, but still clear and effective."
- **Do:** Light grey before dark grey, grey before colour; Dividers and borders lighter than body text; Mute secondary elements
- **Don't:** Black borders and saturated dividers around quiet content; Secondary elements with more contrast than the primary content
- **Look at:** Luminance contrast of non-data, non-text elements (borders, dividers, gridlines, rules) against their background; structural lines above a lens threshold such as 3:1; secondary elements exceeding the primary content's contrast.
- **Unless:** The distinction must still be clear and effective; WCAG text contrast is a floor this rule must not undercut

## 32. `canon.bringhurst-leading-is-a-rhythmic-unit`

The leading is the vertical unit; add and remove vertical space in multiples of it.

- **Source:** Robert Bringhurst, *The Elements of Typographic Style §2.2.1 / §2.2.2 (via webtypography.net)* — http://webtypography.net/2.2.1
- **In their words:** "You must choose not only the overall measure – the depth of the column or page – but also a basic rhythmical unit. This unit is the leading, which is the distance from one baseline to the next."
- **Do:** Use a unitless line-height such as 1.5; Make vertical margins multiples of the line-height
- **Don't:** Vertical spacing unrelated to the line unit; Line-height below 1 on running text
- **Look at:** Body line-height L; margins and paddings between text blocks as multiples of L (or L/2 if the lens allows).
- **Unless:** More leading for longer measures, darker faces, larger x-height and sans serifs: the ratio moves with the face

## 33. `modern.frequent-actions-do-not-animate`

Actions used many times a day, and anything keyboard-triggered, appear instantly without an enter animation.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "Actions that are frequent and low in novelty should avoid extraneous animations: opening a right click menu, deleting or adding items from a list, hovering trivial buttons"
- **Do:** Show context menus, command palettes and list changes instantly; Leave keyboard-driven navigation unanimated
- **Don't:** Opacity and scale fades on controls used hundreds of times a day; Animating keyboard-initiated actions
- **Look at:** Enter animations on [role=menu], [cmdk-root] and newly inserted list items (animation-name not none), and animation state diffed within 16ms of a dispatched key; which actions count as frequent comes from the journey.
- **Unless:** macOS context menus fade out and blink the chosen item; Rare features may be theatrical (delight-impact curve)
- **Also stated as:** modern.motion-values-proportional-to-trigger (Rauno Freiberg); feedback.motion-duration-scales-with-size (IBM Carbon Design System).

## 34. `modern.defaults-are-decisions-you-inherited`

A library or AI default is someone else's decision; commit to one written aesthetic direction instead of inheriting it.

- **Source:** hipuku, *The Default Is Not a Design Decision* — https://www.hipuku.dev/writing/the-default-is-not-a-design-decision
- **In their words:** "The default was always a design decision. Someone made it upstream, and everyone who builds on top inherits it without asking why."
- **Do:** A written token set such as DESIGN.md; One committed aesthetic direction; Semantic colour
- **Don't:** Untouched library defaults; Clean and modern as a brief; The AI-look constellation of purple gradient, Inter, identical cards, glass glow and bounce hover
- **Look at:** Score the constellation: purple-to-blue/cyan gradients warn, Inter or Roboto with no display face notes, 3+ identical icon+h3+p cards note, backdrop-filter plus glow notes, gradient text on numerals warns, overshoot cubic-bezier on hover warns.
- **Unless:** A purple brand is allowed to be purple; the tell is the constellation and the absence of a decision, not any one colour
- **Also stated as:** craft.supercharge-the-defaults (Steve Schoger (attendee notes by ynotdraw)).

## 35. `modern.numbers-and-text-do-not-shift-layout`

Numbers in columns and timers use tabular figures, images carry dimensions, and nothing changes weight on hover.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "tabular figures should be applied with `font-variant-numeric: tabular-nums`, particularly in tables or when layout shifts are undesirable, like in timers"
- **Do:** tabular-nums in tables, timers and prices; width and height on every img
- **Don't:** Proportional digits in columns; Images without dimensions; Weight changes on hover
- **Look at:** Numeric td cells whose computed font-variant-numeric lacks tabular-nums; img without width/height or aspect-ratio; sibling rect drift while a counter fixture runs.
- **Unless:** Prose numbers

## 36. `modern.delight-scales-with-rarity`

Spend delight on rare moments, keep daily actions plain, and never let an element visibly duplicate itself during a transition.

- **Source:** Benji Taylor, *Family Values* — https://benji.org/family-values
- **In their words:** "the potential for delight increases as the frequency of feature usage decreases"
- **Do:** Directional motion between tabs; Morphing labels such as Continue to Confirm; One action per tray
- **Don't:** Static jumps on core flows; Theatrical motion on daily actions; An element visibly duplicated mid-transition
- **Look at:** After a transition, count DOM nodes with the same key or text present twice on screen at once; frequency-weighted motion needs the journey to say what is frequent.
- **Unless:** Utility, performance and security come first; delight is selective emphasis

## 37. `modern.animate-only-transform-and-opacity`

Animate only transform and opacity, listing properties explicitly; never transition all or animate layout properties.

- **Source:** Emil Kowalski, *Great Animations* — https://emilkowal.ski/ui/great-animations
- **In their words:** "you should try to animate with `transform` and `opacity` as they only trigger the third rendering step (composite)"
- **Do:** Prefer CSS, then WAAPI, then JS for motion; Use clip-path for reveals; List transitioned properties explicitly
- **Don't:** transition: all; Animating width, height, top, left, margin or padding; Large blur() values on filter or backdrop-filter in motion
- **Look at:** Scan stylesheets and computed transition-property for all and for layout properties; scan @keyframes for width, height, top and left.
- **Unless:** Accordion height animation via grid-template-rows or interpolate-size is layout by nature and accepted when it is the only honest way

## 38. `modern.motion-has-an-origin`

A popover or menu animates from the side facing its trigger; set transform-origin where the motion physically starts.

- **Source:** Emil Kowalski, *Good vs Great Animations* — https://emilkowal.ski/ui/good-vs-great-animations
- **In their words:** "When we click on a button that opens a dropdown, we expect the dropdown to animate from where the button is"
- **Do:** Set transform-origin toward the trigger; Use the anchoring library's origin variable when one exists
- **Don't:** Popovers scaling from their own centre when anchored to a button
- **Look at:** For each open popover or menu with a known trigger (aria-controls or aria-haspopup), compare the computed transform-origin with the side facing the trigger.
- **Unless:** Centred modals have no anchor; a centred origin is right there

## 39. `modern.honour-prefers-reduced-motion`

Every large motion has a reduced variant under prefers-reduced-motion; fade instead of slide rather than ignoring the setting.

- **Source:** Emil Kowalski, *Great Animations* — https://emilkowal.ski/ui/great-animations
- **In their words:** "our animations need to account for people who don't want animations"
- **Do:** Provide a reduced variant such as a fade instead of a slide; Give autoplaying motion over five seconds pause, stop or hide controls
- **Don't:** Large translate or scale motion that ignores the media query
- **Look at:** Emulate prefers-reduced-motion: reduce and list elements whose computed animation-name or transition-property still includes translations over about 20px or durations above zero.
- **Unless:** Motion that is the content, such as a video or a chart drawing, is out of scope

## 40. `modern.animations-are-interruptible`

An open or close animation can be reversed mid-flight by the next input; nothing waits for a transition to finish.

- **Source:** Emil Kowalski, *Great Animations* — https://emilkowal.ski/ui/great-animations
- **In their words:** "Great animations are interruptible"
- **Do:** Use CSS transitions that reverse mid-flight, or spring libraries
- **Don't:** pointer-events: none locks while an animation plays; Keyframe-driven open and close that must finish before the next input
- **Look at:** Open a panel, immediately send the close input, sample the element's bounding box about 50ms later; if it is still growing the animation was not interruptible. Depends on timing tolerance.
- **Unless:** Destructive commits that fire only on gesture end are about triggering, not interruptibility

## 41. `modern.readable-type-sizes-and-weights`

Body text sits at the platform default size, weights stay 400 or heavier, and weight never changes on hover.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "Font weights below 400 should not be used"
- **Do:** 17px body on touch, 13px minimum on desktop UI; Weights between 400 and 700; Headings at weight 500–600; Minimise the number of typefaces
- **Don't:** Body text under 11pt; font-weight 300 or lower; Weight swaps on hover or selected state
- **Look at:** Computed font-size and font-weight of every text node at a phone viewport; count distinct font-family stacks and warn above 2.
- **Unless:** Captions and legal text may sit at the platform minimum; Display headings may use light weights at large sizes

## 42. `modern.focus-is-visible-and-unobscured`

Every focusable element shows a visible focus ring on :focus-visible, and no sticky or fixed element ever covers it.

- **Source:** Vercel Labs, *Web Interface Guidelines — AGENTS.md* — https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/AGENTS.md
- **In their words:** "NEVER: `outline: none` without visible focus replacement"
- **Do:** Style :focus-visible with box-shadow or outline plus outline-offset
- **Don't:** outline: none or 0 with no replacement; Focus rings hidden under sticky headers
- **Look at:** Tab through every focusable element; diff the focused and unfocused rect or read computed outline and box-shadow under :focus-visible; check the focused rect is not intersected by position fixed or sticky elements above it.

## 43. `modern.shadows-share-one-light-source`

All shadows on a page share one light direction and offset ratio, layered and tinted toward the background hue.

- **Source:** Josh W. Comeau, *Designing Beautiful Shadows in CSS* — https://www.joshwcomeau.com/css/designing-shadows/
- **In their words:** "every shadow on the page should share the same ratio"
- **Do:** A tokenised elevation scale; Two to five layered shadows; Shadow colour matched to the background hue
- **Don't:** Fuzzy grey boxes; Shadows with inconsistent x:y ratios across the page; Pure-black high-alpha shadows; Blurry borders used as separators
- **Look at:** Collect every computed box-shadow; fail when offset signs mix across the page or distinct shadow strings exceed about 6; warn when shadow hue is far from the background hue with alpha above 0.5.
- **Unless:** Inset shadows for sunken fields; Glows meant as glows

## 44. `modern.glass-and-blur-earn-their-place`

Translucency is for chrome over busy backgrounds with heavy blur and a contrast fallback, never for body content or decoration.

- **Source:** Megan Brown (NN/G), *Glassmorphism: Definition and Best Practices* — https://www.nngroup.com/articles/glassmorphism/
- **In their words:** "glassmorphism is best when utilized sparingly to create an illusion of depth"
- **Do:** Glass on toolbars and menus only; Heavy blur over intricate backgrounds; A solid fallback under increased contrast
- **Don't:** Glass cards for body content; Low blur over photos; Text whose contrast depends on what scrolls beneath it; Glass with a neon glow as decoration
- **Look at:** For each element with backdrop-filter, sample contained-text contrast against the composited background at three scroll positions; any under 4.5:1 fails; blur under 12px over an image warns; body text over 2 lines inside glass warns.
- **Unless:** OS-level materials that honour the user's Reduce Transparency setting

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
- **Also stated as:** color.mode-aware-tokens-in-every-theme (GitHub Primer).

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

## 51. `writing.dates-numbers-units-for-the-reader`

Dates spell out the month, numbers are numerals with thousands separators, and units sit a space after their number — formatted in the reader's locale, never as an ambiguous all-numeric date or a raw machine value.

- **Source:** Shopify Polaris, *Content: Grammar and mechanics, 'Numbers, dates, and currency'* — https://polaris.shopify.com/content/grammar-and-mechanics
- **In their words:** "Use the month’s full name. If there isn’t enough space, use 3-letter abbreviations. Don’t write dates with numerals only."
- **Do:** 'December 11, 2024' or 'Dec 11, 2024' (in the reader's locale order); Numerals, not words: 'You have 5 orders to fulfill'; Thousands separators: '12,000'; A space between number and unit: '3.4 lb', '2 kg'; Currency code after the amount when currencies can be confused: '$10,000 USD'; Format with Intl.DateTimeFormat / Intl.NumberFormat for the user's locale
- **Don't:** All-numeric dates like '12/11/24'; ISO timestamps or epoch values shown raw ('2024-12-11T09:30:00Z'); Ordinals in dates ('January 23rd'); Unit glued to the number ('3.4lb'); Shortened numbers like '12 k' where the exact value matters
- **Look at:** Scan visible text nodes. Count matches of all-numeric dates (\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b), raw ISO timestamps (\d{4}-\d{2}-\d{2}T\d{2}:), integers of 5+ digits with no separator outside codes/IDs, and numbers glued to a unit (\d(kg|lb|cm|mm|km|mi|ml|oz)\b). Count must be 0.
- **Unless:** Polaris notes these are American English base rules and dates, numbers and measurements should be localized automatically — the target is the reader's locale, not US format; Identifiers, codes, SKUs and years are not quantities and take no separator; Dense data tables may use compact numeric dates if the format is unambiguous for the locale and stated in the column header

## 52. `data-display.no-tables-for-layout`

A table is for comparing data in rows and columns, never for arranging content on the page; layout belongs to the grid.

- **Source:** GOV.UK Design System (Government Digital Service), *Table — When not to use this component* — https://design-system.service.gov.uk/components/table/
- **In their words:** "Never use the table component to layout content on a page."
- **Do:** CSS grid or flex for page and dashboard layout; A list, cards or a summary list for items that do not share columns; Tables only where every row has the same fields
- **Don't:** A table that positions a sidebar, form or dashboard tiles; Table cells holding headings, paragraphs or whole forms; role=presentation on a table that actually holds tabular data
- **Look at:** Count table elements that have no th and either contain headings, more than one paragraph per cell, form fieldsets or nested tables, or have a single row whose cells hold unrelated content blocks.
- **Unless:** HTML email, where tables are still the only reliable layout tool

## 53. `data-display.long-tables-sort-and-say-so`

Long tables let users sort the columns that have a natural order, start with one column sorted, and expose the sort state to assistive technology.

- **Source:** U.S. Web Design System (GSA), *Table — Usability guidance* — https://designsystem.digital.gov/components/table/
- **In their words:** "Enable sort where useful. Add row sorting to individual columns of long tables where the data can be logically ordered either alphabetically or numerically."
- **Do:** Sort controls as buttons inside the th of sortable columns; One column sorted on load, shown with an arrow and aria-sort on its th (Primer); A polite live region that announces the new sort (USWDS); A filter or search field above long tables, and pagination for very large sets
- **Don't:** Long tables with no sort, filter or pagination; A sort state shown only by an icon with no aria-sort; Row sorting on tables with merged (colspan/rowspan) cells
- **Look at:** Count tables with more than 20 body rows (or with pagination) that have no sort control in any th and no filter/search input associated with them; among sortable tables, count those where no th carries aria-sort other than none.
- **Unless:** Short tables a user takes in at a glance; Tables whose row order is itself the meaning (a ranked list, a timetable) may fix the order
- **Also stated as:** navigation.pagination-says-where-and-how-many (U.S. Web Design System (USWDS)).

## 54. `data-display.one-unit-and-format-per-column`

Every value in a column uses the same unit, precision and format; the unit is named once in the header, not repeated in each cell.

- **Source:** U.S. Web Design System (GSA), *Table — Usability guidance* — https://designsystem.digital.gov/components/table/
- **In their words:** "Predictably format columns. Take care not to vary units or formatting within the same column. Instead, normalize values so they can be easily compared."
- **Do:** Normalise a column to one unit (all days, not days and weeks); Keep the same number of decimal places in every row of a column; Put the unit or symbol in the column header ('Temperature °C') rather than in every cell; Use one date format and one thousands separator throughout the table
- **Don't:** Mixing '3 days' and '2 weeks' in one column; '12.5', '12.50' and '12.500' in the same column; Abbreviating some values ('1.2k') and not others in the same column
- **Look at:** For each column of numeric td, count distinct decimal-place counts, distinct unit suffixes or prefixes, and distinct date formats; any column with more than one is a failure.
- **Unless:** A column deliberately mixing magnitudes where the unit changes are labelled per cell and sorting is by underlying value — rare, and worth questioning

## 55. `data-display.header-cells-are-th-with-scope`

A data table marks its header cells as th and its data cells as td; when headers run both across and down, scope (or id/headers in complex tables) ties each cell to its headers.

- **Source:** W3C WAI (Eric Eggert, Shadi Abou-Zahra, eds.), *Tables Tutorial* — https://www.w3.org/WAI/tutorials/tables/
- **In their words:** "Header cells must be marked up with <th>, and data cells with <td> to make tables accessible. For more complex tables, explicit associations may be needed using scope, id, and headers attributes."
- **Do:** A thead row of th scope=col in every data table; th scope=row for the first cell when it names the row's item; id and headers attributes when a cell sits under more than one level of header; A caption that names the table
- **Don't:** Header rows built from td styled bold; Div grids that look like tables with no role=table/row/columnheader/cell semantics; One table holding several topics separated by extra rows of th
- **Look at:** Count table (and role=table/grid) elements that have more than one row of data and no th / role=columnheader; count tables with both a header row and a header column whose th lack scope; count tables with no caption, aria-label or aria-labelledby.
- **Unless:** A simple table with one header row needs only th, not scope; scope matters once there are header rows and header columns; Layout tables, which should not exist (see data-display.no-tables-for-layout)

## 56. `data-display.summary-list-for-key-value-facts`

A set of facts about one thing — label and value pairs — is shown as a summary list (dl with dt and dd), not as a table with no headers or as loose text.

- **Source:** GOV.UK Design System (Government Digital Service), *Summary list — When to use / When not to use this component* — https://design-system.service.gov.uk/components/summary-list/
- **In their words:** "Use a summary list to show information as a list of key facts. … only use it to present information that has a key and at least one value."
- **Do:** dl with dt (the key) and dd (the value) for record details, metadata and check-your-answers pages; A row action ('Change') whose accessible name includes the key ('Change name'); Headings or cards to separate several summary lists on one page
- **Don't:** A two-column table without th used to show one record's fields; Key–value pairs set as 'Label: value' runs in a paragraph; A summary list for genuinely tabular data or a plain list of items
- **Look at:** Where the screen shows the fields of a single record (a profile, an order, an item's metadata, a check-answers page), are the label–value pairs marked up as dl/dt/dd with each key visually distinct from its value — and is tabular data comparing several records in a table rather than a summary list?
- **Unless:** Two or three facts inside a card may be inline text if they are not scanned as a set

## 57. `forms.keep-answers-after-an-error`

When a submit fails, show the form again with every answer the user gave still in it — the failing ones and the passing ones.

- **Source:** GOV.UK Design System, *Error message component — How it works* — https://design-system.service.gov.uk/components/error-message/
- **In their words:** "Do not clear any form fields when showing the Error message component. Keep both passing and failing answers."
- **Do:** Re-render server-side errors with submitted values filled in; Keep the failing value so the user can see and edit what went wrong; Pre-populate fields when the user goes back to change an answer
- **Don't:** A reload that empties the form after a server error; Clearing the field that failed; Clearing password-adjacent fields such as name and email along with the password
- **Look at:** Fill every field with valid values except one, submit, and after the error page paints read each input's value: how many fields that had a value now read empty?
- **Unless:** Password and card security code fields may be cleared for security, and the message should say so
- **Also stated as:** feedback.time-limits-warn-and-extend (W3C Accessibility Guidelines Working Group).

## 58. `forms.error-summary-at-the-top`

After a failed submit, show an error summary at the top of the page that takes focus and links each error to its field — even when there is only one error.

- **Source:** GOV.UK Design System, *Error summary component* — https://design-system.service.gov.uk/components/error-summary/
- **In their words:** "Always show an error summary when there is a validation error, even if there’s only one."
- **Do:** A summary above the h1 (below any back link) with a heading such as 'There is a problem'; Move keyboard focus to the summary when it appears; One link per error, pointing at the field (or the first field of a date or radio group); Word each summary item exactly like the message beside its field; Prefix the page <title> with 'Error: '
- **Don't:** Errors shown only beside fields far down a long form, with focus left on the submit button; A summary of plain text with no links to the fields; A toast or banner that disappears before it can be read
- **Look at:** Submit the form empty. Within 1 s: is there an element above the first h1 of main that has focus (document.activeElement inside it), contains one link per invalid field, and does each link's href resolve to the id of an invalid input? Does document.title start with 'Error'?
- **Unless:** Primer suggests the interactive summary only for 3 or more errors, and otherwise focusing the first invalid field; A one-field form (search, single email sign-up) can rely on the message beside the field

## 59. `forms.validate-when-the-user-is-done`

Do not show an error while the user is still typing; validate when they try to continue, and only add earlier validation where research shows it helps.

- **Source:** GOV.UK Design System, *Recover from validation errors pattern — When to tell the user about validation errors* — https://design-system.service.gov.uk/patterns/validation/
- **In their words:** "Generally speaking, avoid validating the information in a field before the user has finished entering it. This sort of validation can cause problems - especially for users who type more slowly."
- **Do:** Validate on Continue or Submit; After a failed submit, update a field's error live once the user fixes it (Primer); A character count is the accepted exception: warn as the limit is passed
- **Don't:** An error that appears on the first keystroke of an email or phone field; Red borders on an untouched form at load; Browser-native HTML5 validation bubbles in place of designed messages
- **Look at:** Focus an email or formatted field and type one character, keeping focus. Wait 1 s. Does any error message, aria-invalid=true or error colour appear before blur or submit? Also load the form fresh: are any fields already marked invalid?
- **Unless:** GOV.UK goes further and says not to validate on blur either; Baymard (usability.inline-validation-after-leaving-field) recommends blur validation for hard fields — the schools agree only on 'not while typing'; Primer allows validating as the user types once the field has already been flagged invalid, so the error clears as soon as it is fixed

## 60. `forms.mark-optional-fields-in-words`

Ask mostly required questions and label the exceptions '(optional)' in words; do not mark required fields with asterisks.

- **Source:** GOV.UK Design System, *Question pages pattern* — https://design-system.service.gov.uk/patterns/question-pages/
- **In their words:** "in most contexts, add ‘(optional)’ to the labels of optional fields"
- **Do:** '(optional)' in the label, or in the legend for a radio or checkbox group; Removing optional questions before marking them; One convention across the whole service
- **Don't:** Asterisks on mandatory fields; Optional fields that look identical to required ones; Required and optional marked differently on different pages
- **Look at:** Submit the form with every field empty and note which fields raise no error (optional). Count optional fields whose label or legend text lacks 'optional', and labels that contain '*'.
- **Unless:** USWDS instead marks required fields with a red asterisk explained by a note at the top, and also labels optional fields '(optional)' — the schools agree that optional fields say so in words; Primer and USWDS exempt one-field forms and login forms, where every field is plainly required

## 61. `forms.input-type-matches-the-answer`

Give each field the type and on-screen keyboard its answer needs — email, tel, inputmode numeric or decimal for numbers — and avoid type=number.

- **Source:** GOV.UK Design System, *Text input component — Numbers* — https://design-system.service.gov.uk/components/text-input/
- **In their words:** "With <input type="number"> there’s a risk of users accidentally incrementing a number when they’re trying to do something else - for example, scroll up or down the page."
- **Do:** type='email' with spellcheck=false for email addresses; type='tel' for phone numbers; type='text' with inputmode='numeric' for whole numbers and codes, inputmode='decimal' for amounts; spellcheck=false on names, references and codes
- **Don't:** type='number' for card numbers, postcodes, account numbers or reference codes; type='text' with no inputmode on a field that only accepts digits; Blocking paste into any field
- **Look at:** For each input, read type and inputmode against its label: count email fields not type=email, phone fields not type=tel, digit-only fields (amount, quantity, code, card, account) with neither inputmode numeric/decimal nor type=tel, and any type=number.
- **Unless:** type=number when research shows a need, such as a stepper on a small bounded quantity; Negative amounts: GOV.UK advises type=text without inputmode, since some keypads have no minus key

## 62. `forms.ask-only-what-you-need`

Every question on the form has a named use; drop the ones nobody can justify, and never ask for the same thing twice in one journey.

- **Source:** GOV.UK Design System, *Question pages pattern* — https://design-system.service.gov.uk/patterns/question-pages/
- **In their words:** "You should make sure you know why you’re asking every question and only ask users for information you really need."
- **Do:** A question protocol: for each field, who uses the answer and what for; Reuse an earlier answer by pre-filling it rather than asking again; Let 'I do not know' be an answer where it is a valid one; Say why a sensitive question is asked, in its hint
- **Don't:** 'Nice to have' fields such as title, gender or 'how did you hear about us' with no stated use; Asking for an email or address a second time in the same journey; Confirm-email fields that make the user type the address twice, instead of playing it back for checking
- **Look at:** List every field on the form. For each, can the team name who reads the answer and what decision it changes? How many fields have no answer, and how many repeat information given earlier in the journey?
- **Unless:** Legal or regulatory questions whose use is mandated, which should still say why in a hint

## 63. `navigation.tabs-switch-views-in-one-context`

Tabs switch between related views of one context: they sit directly above the content they change, exactly one is selected, and a tab set never mixes tabs that load a URL with tabs that toggle a panel; they are not site navigation and not steps.

- **Source:** GitHub Primer, *Navigation (UI pattern)* — https://primer.style/product/ui-patterns/navigation/
- **In their words:** "Activating a tab may or may not change the URL, but you can't mix tabs that change the URL with tabs just switch the visible tab panel."
- **Do:** Either all items are links to distinct URLs (an underline nav with aria-current) or all are role=tab controlling a role=tabpanel; One tab selected by default when the page loads; The tab row directly above the panel it changes; Views that can be visited in any order, each complete enough that the user need not switch back and forth
- **Don't:** A tab row in which some items toggle a panel and one jumps to another page; Tabs used as the site's primary navigation; Tabs for the steps of a process, or for content the user must compare side by side; More than two levels of tabs
- **Look at:** For each tablist or tab-styled row of links: does exactly one item carry aria-selected="true" or aria-current? Are the items either all <a href> to distinct URLs or all role=tab with aria-controls pointing at an existing role=tabpanel? Is the controlled panel (or main content) the next block below the row, with no other interactive element between them? Is the row nested inside at most one other tab row?
- **Unless:** Sources disagree on filtered views of one list: Polaris puts them in tabs ('a list-view with different filters applied'); Carbon sends filtering to a content switcher; Primer's underline nav wants discrete content, not formats of the same content; GOV.UK: without JavaScript and on small screens its tabs render as one page with a contents list; that passes; GOV.UK warns that tabs hide content and not everyone notices them; consider headings on one page first

## 64. `navigation.breadcrumbs-only-for-real-hierarchy`

Breadcrumbs belong on pages more than two levels deep in a hierarchy; never on a flat site, never to show steps in a linear flow, and never in place of the primary navigation.

- **Source:** GOV.UK Design System, *Breadcrumbs component* — https://design-system.service.gov.uk/components/breadcrumbs/
- **In their words:** "Do not use the breadcrumbs component on websites with a flat structure, or to show progress through a linear journey or transaction."
- **Do:** A trail that starts with the word 'Home' and follows the site's hierarchy, not the user's click history; Breadcrumbs placed at the top of the page, before <main>, so the skip link skips them; Every ancestor a link; the current page last and marked aria-current, or left off; Breadcrumb wording identical to the page titles it points at
- **Don't:** Breadcrumbs that list the steps of a sign-up or checkout; 'Home > About' on a site whose every page is linked from the top nav; Breadcrumbs as the only way to move between sections; Breadcrumbs and a Back link on the same page
- **Look at:** If the page has a breadcrumb (a nav whose accessible name contains 'breadcrumb', or an ordered list of links styled as one, before main): does it hold at least two ancestor links (Home > Section > page), does it sit before main, is every item except the current page a link, is there also a primary nav on the page, and is there no Back link and no step indicator on the same page?
- **Unless:** 'At least two ancestor links' is uxcli's reading of Carbon's 'more than two levels'; no source gives a link count; GOV.UK ends the trail with the parent section; Primer and USWDS end it with the current page marked aria-current; either passes; USWDS: omit breadcrumbs on the home page and optionally on section landing pages, and where a side navigation already shows the hierarchy; Carbon recognises path-based breadcrumbs (the steps the user took) as a type; GOV.UK and USWDS do not, and this viewpoint follows them

## 65. `navigation.skip-link-is-the-first-tab-stop`

The first Tab press on every page lands on a visible 'Skip to main content' link that moves focus past the header and navigation into main.

- **Source:** GOV.UK Design System, *Skip link component* — https://design-system.service.gov.uk/components/skip-link/
- **In their words:** "Including the skip link component gives users the option to bypass the top-level navigation links and jump to the main content on a page."
- **Do:** The skip link immediately after <body> (or after a cookie banner); Visually hidden until it receives keyboard focus, then clearly shown; A target id on <main> (or its first heading) that can take focus; Breadcrumbs and back links placed before <main>, so the skip link skips them too
- **Don't:** A page whose first Tab stop is the logo or the first of a dozen nav links; A skip link that stays invisible when focused; A skip link whose href points at an id that does not exist; A skip link wrapped in <nav> or moved inside the header
- **Look at:** Load the page and press Tab once: is document.activeElement an <a> whose href is '#id' of an element that is main or inside main, with a non-zero box inside the viewport and opacity above 0? Press Enter, then Tab: is focus on an element inside main?
- **Unless:** WCAG 2.4.1 is met by other means too (landmarks, headings); the first-Tab test follows GOV.UK and Carbon practice and is stricter than the criterion; WCAG: when the repeated navigation is at the bottom of the page, a skip link may be unnecessary; A page with no repeated block before main (a bare single-purpose page) has nothing to skip

## 66. `navigation.more-than-one-way-to-a-page`

Each page in a set can be reached more than one way — navigation plus search, a site map, an index or links between related pages — except pages that are a step in, or the result of, a process.

- **Source:** W3C WAI, *Understanding SC 2.4.5 Multiple Ways* — https://www.w3.org/WAI/WCAG22/Understanding/multiple-ways.html
- **In their words:** "Provide at least two options for reaching the same content."
- **Do:** A site search in the header that searches this site and says so ('Search [service]'); A site map, A–Z index or table of contents linked from the footer of every page; Related-page links inside content, in addition to the menu
- **Don't:** A large site whose only route to a page is a deep menu; A search box that searches something other than the site it sits on, without saying so
- **Look at:** On every page of a set larger than a handful: besides the nav landmark, is there a search form (role=search, or input[type=search]) or a link to a site map or index in the header or footer? Searching the h1 of a sampled deep page: does the search return that page?
- **Unless:** WCAG: for a three- or four-page site with every page linked from the home page, links to and from the home page can suffice; WCAG exempts pages that are the result of, or a step in, a process (a payment step, a search results page); 'Larger than a handful' is uxcli's threshold; WCAG applies the criterion to any set of pages and names no size

## 67. `feedback.toasts-carry-nothing-critical`

A toast is only for a short, low-priority confirmation of something the user just did; an error that needs action, a warning, or anything the user cannot find again elsewhere goes in an inline message or banner that stays.

- **Source:** Shopify Polaris, *Toast component — Accessibility* — https://polaris.shopify.com/components/deprecated/toast
- **In their words:** "Avoid using toast for critical information that merchants need to act on immediately."
- **Do:** Short noun + verb confirmations: 'Product updated', 'Collection added'; Errors the user must fix shown next to the cause or in a banner that persists until resolved; Whatever the toast says also visible somewhere on the page after it goes (the saved value, the item in the list, a notifications area)
- **Don't:** A validation or payment error delivered only as a toast that auto-dismisses; A toast that holds the only copy of a generated password, link or code; Several sentences of explanation in a toast
- **Look at:** Record a walk through every action, including forced failures (offline, 4xx, 5xx). Treat as a toast any fixed- or absolute-positioned element with role=status|alert or aria-live that is removed or hidden within 15 s without user input. Count toasts whose text matches error/failed/could not/denied/invalid, toasts with more than 15 words, and toasts whose distinctive text (any token of 6+ characters other than common words) appears nowhere in the DOM 2 s after they leave. Count must be 0.
- **Unless:** Polaris allows an error toast for system errors not caused by the user, such as 'Internet disconnected', in 3 words; Polaris's own Toast component is deprecated in favour of the App Bridge Toast API; the guidance quoted is still on its page; The 15 s, 15-word and 6-character thresholds are uxcli's
