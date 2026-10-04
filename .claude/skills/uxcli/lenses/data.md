# Data and dashboards — the `data` lens

Dashboards, analytics, monitoring and reports: numbers and charts read again and again.

54 viewpoints from named designers. Answer every one for the screen you are looking at: `holds` with where, `breaks` with where and what, `n/a` with why. The sequence, the review file and `uxcli review check` are in `../references/lenses.md`. The rules are the designers', not uxcli's and not yours.

## 1. `usability.feedback-within-a-second`

Paint something within 0.1 s; keep the user's flow with a response under 1 s; show a progress indicator for anything longer.

- **Source:** Jakob Nielsen, *Response Times: The 3 Important Limits (1993)* — https://www.nngroup.com/articles/response-times-3-important-limits/ (study)
- **In their words:** "0.1 second is about the limit for having the user feel that the system is reacting instantaneously … 1.0 second is about the limit for the user's flow of thought to stay uninterrupted"
- **Do:** Use a progress indicator for any action over about 1 s; Use a looped indicator for 2–9 s waits; Use a percent-done indicator for 10 s or more
- **Don't:** Leave dead time with no indicator; Show a percent-done bar that lies badly
- **Look at:** Time from input event to first paint of any change; presence of a progress element, aria-busy, <progress> or role=status update when the wait exceeds 1 s.
- **Unless:** Laws of UX claims a purposeful delay can raise perceived value — an opinion with no study cited
- **Also stated as:** modern.interactions-feel-immediate-under-200ms (Rauno Freiberg); modern.density-is-value-per-time-and-space (Matthew Ström-Awn); feedback.status-messages-announced-without-focus (W3C Accessibility Guidelines Working Group).

## 2. `usability.visibility-of-system-status`

Every action with consequences shows the user something changed, as quickly as possible, so they always know what the system is doing.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #1* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "The design should always keep users informed about what is going on, through appropriate feedback within a reasonable amount of time."
- **Do:** Show a visible trace of every state change; Give feedback immediately, or as quickly as possible; Disable and label a control while its action runs
- **Don't:** Submit silently; Change state with no visible trace; Show an action's result only somewhere else
- **Look at:** Drive an action, then diff DOM or pixels over the next frames: did anything visibly change within 1 s; is there a live region, status text, spinner or busy state?
- **Unless:** Below 0.1 s no special feedback is needed beyond showing the result
- **Also stated as:** modern.feedback-is-local-and-optimistic (Rauno Freiberg); writing.success-names-what-happened (Shopify Polaris).

## 3. `usability.speak-the-users-language`

Write in the words the actor already uses; no internal jargon, error codes or unexplained abbreviations.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #2* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "The design should speak the users' language. Use words, phrases, and concepts familiar to the user, rather than internal jargon."
- **Do:** Use words the user understands without looking them up; Spell acronyms out in full on each page; Write 'for example', not 'eg' or 'ie'
- **Don't:** Show bare error codes; Expose internal entity names; Use unexplained abbreviations
- **Look at:** Flag bare error codes (e.g. ERR-422, Error 0x…), all-caps acronyms not defined on the page, and Latin abbreviations; whether a term is jargon for this actor needs the journey's actor.
- **Unless:** Expert-only tools where the domain term is the users' language — match the user, do not simplify per se
- **Also stated as:** writing.errors-say-what-and-how-to-fix (GOV.UK Design System (Government Digital Service)).

## 4. `usability.clearly-marked-emergency-exit`

Every interaction has a visible, labelled way out — Cancel, Back, Escape, Undo — so a mistaken action does not trap the user.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #3* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "Users often perform actions by mistake. They need a clearly marked 'emergency exit' to leave the unwanted action without having to go through an extended process."
- **Do:** Support Undo and Redo; Show a clear Cancel or close control; Label the exit clearly and make it discoverable
- **Don't:** Open a modal with no close; Build a wizard step with no back; Ship a destructive action with no undo
- **Look at:** For each role=dialog or modal: a focusable control whose text or aria-label matches close/cancel/back, and Escape dismisses it; for each step past the first in a flow: a back control exists.
- **Unless:** Legally required interstitials — the exit must still be visible, not necessarily free of consequence
- **Also stated as:** writing.destructive-actions-name-the-consequence (IBM Carbon Design System); feedback.toast-actions-wait-for-the-user (Shopify Polaris); feedback.destructive-actions-confirmed-or-undoable (U.S. Web Design System).

## 5. `usability.signifiers-make-clickable-look-clickable`

Links and buttons must look clickable — colour, underline, border or fill — because weak signifiers cost measured time and fixations.

- **Source:** Kate Moran, NN/g, *Flat UI Elements Attract Less Attention and Cause Uncertainty (2017)* — https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/ (study)
- **In their words:** "22% more time"
- **Do:** Make links stand out from body text; Make buttons resemble physical buttons with rectangular shapes; Apply consistent treatment throughout the site; Provide signifiers rather than rely on affordances
- **Don't:** Style linked text as static text; Use ghost buttons as the default; Use disabled buttons if avoidable; Rely on a label to say that a control is a control
- **Look at:** For each a[href], button, [role=button]: computed colour, underline, border and background versus surrounding text; a link matching body colour with no underline and no other differentiator is weak; count disabled buttons.
- **Unless:** Link position in nav menus or peripheral lists may eliminate the need for underlining (Loranger); Flat works best with low information density, traditional layouts and high-contrast targets positioned standardly (Moran)
- **Also stated as:** modern.signifiers-survive-flatness (Kate Moran (NN/G)); modern.no-dead-zones-and-honest-clickability (Rauno Freiberg).

## 6. `usability.fitts-target-size-and-distance`

Make targets big, space them apart, and put them where the pointer already is; touch targets at least 1 cm square.

- **Source:** Aurora Harley, NN/g, *Touch Targets on Touchscreens (2019)* — https://www.nngroup.com/articles/touch-target-size/ (study)
- **In their words:** "at least 1cm × 1cm (0.4in x 0.4in)"
- **Do:** Make targets big; Give icons labels so the label extends the target; Keep ample spacing between targets; Put the call to action near the final form fields
- **Don't:** Pack icon-only 24 px controls edge to edge on touch layouts; Crowd targets
- **Look at:** Bounding box of each interactive element at the mobile viewport (1 cm ≈ 38 CSS px; 24/44 px are the usual proxies); centre-to-centre spacing; distance from last input to submit; label inside the clickable box.
- **Unless:** Infinite targets along screen edges for mouse — size matters less at an edge; Primary CTAs, moving users, children and the elderly need larger than the minimum
- **Also stated as:** craft.tap-targets-and-control-height (Erik D. Kennedy); modern.hit-targets-meet-platform-minimums (Apple).

## 7. `usability.omit-needless-words`

Cut word count by half: no happy-talk intros, no instruction paragraphs before forms, no marketese, sentence case everywhere.

- **Source:** Jakob Nielsen, *How Users Read on the Web (1997)* — https://www.nngroup.com/articles/how-users-read-on-the-web/ (study)
- **In their words:** "People rarely read Web pages word by word; instead, they scan the page"
- **Do:** Reduce word count by half compared to traditional writing; Limit paragraphs to one idea each; Use sentence case everywhere except proper nouns
- **Don't:** Open with welcome or happy talk; Put instruction paragraphs before forms; Use promotional language ('marketese'); Set labels in ALL CAPS or Title Case
- **Look at:** Word count between a form's heading and its first input; word count of blocks starting 'Welcome' or 'Thank you for'; buttons and labels in all caps or Title Case; sentence count in instructions.
- **Unless:** Nielsen also asks for outbound links to build trust — brevity is not zero text
- **Also stated as:** writing.sentence-case-ui-text (IBM Carbon Design System).

## 8. `usability.no-false-affordances`

Nothing that is not interactive may look interactive: no underlined or blue static text, no button-shaped badges, no pointer cursor on inert elements.

- **Source:** Hoa Loranger, NN/g, *Beyond Blue Links: Making Clickable Elements Recognizable (2015)* — https://www.nngroup.com/articles/clickable-elements/
- **In their words:** "Avoid making non-clickable items (like headings) resemble buttons."
- **Do:** Reserve link colour and underline for links; Reserve button shape and fill for buttons
- **Don't:** Give static items hyperlink colours; Underline non-interactive text; Make headings or badges resemble buttons
- **Look at:** Elements with no href, handler, role or tabindex that have cursor: pointer, underline plus link colour, or a button-like box (border-radius, filled background, short centred text).

## 9. `usability.natural-mapping-and-proximity`

Put a control next to the thing it changes and a label next to its field; gaps between groups must exceed gaps within them.

- **Source:** Marieke McCloskey, NN/g, *Form Design Quick Fix: Group Form Elements Effectively Using White Space (2013)* — https://www.nngroup.com/articles/form-design-white-space/
- **In their words:** "items near each other appear related"
- **Do:** Place labels as close to their fields as possible; Group related fields together; Place related targets close to each other; Put the call to action near the final form fields
- **Don't:** Put a control far from the thing it changes; Separate groups by less space than their members
- **Look at:** Distance from each label to its own input versus the nearest other input; gap within a fieldset versus gap between fieldsets; distance from last input to the submit button.
- **Unless:** Left-aligned labels are acceptable if space is constrained and labels are of similar length
- **Also stated as:** craft.law-of-locality (Erik D. Kennedy).

## 10. `usability.aesthetic-usability-effect-bias`

Polish makes a screen look more usable than it is; discount your aesthetic impression and run the measurable checks first.

- **Source:** Kate Moran, NN/g, *The Aesthetic-Usability Effect (2024, rev. 2026)* — https://www.nngroup.com/articles/aesthetic-usability-effect/ (study)
- **In their words:** "Users' tendency to perceive attractive products as more usable. People tend to believe that things that look better will work better — even if they aren't actually more effective or efficient."
- **Do:** Rate your own screen after the measurable checks, not before; Treat polish as tolerance for minor problems only
- **Don't:** Read polish as usability; Let an attractive surface hide a usability problem
- **Look at:** Did the evaluator judge the screen usable because it looks good? Re-check the verdict against the count-kind entries before trusting it; 'attractive' is the variable and stays taste.
- **Unless:** With severe usability issues, or functionality sacrificed for aesthetics, users lose patience

## 11. `usability.start-with-user-needs-design-with-data`

Name the actor and their need before drawing a screen, then let measured behaviour, not hunches or looks, decide what changes.

- **Source:** GDS / GOV.UK, *Government Design Principles, principles 1, 3 and 4* — https://www.gov.uk/guidance/government-design-principles
- **In their words:** "Service design starts with identifying user needs. If you don't know what the user needs are, you won't build the right thing."
- **Do:** State the actor and need before the screen; Measure real behaviour; Start small and iterate
- **Don't:** Design to a hunch; Design to an aesthetic
- **Look at:** Does the journey name its actor and need (uxcli context show), and is the design decision traceable to observed behaviour rather than a hunch or a look?

## 12. `craft.dont-overlook-empty-states-teach-by-example`

Design the first-load and empty states with sample data or an example, a message and a call to action; never a blank page.

- **Source:** Erik D. Kennedy, *4 Rules for Intuitive UX* — https://www.learnui.design/blog/4-rules-intuitive-ux.html
- **In their words:** "Use the 'first load' experience to provide sample data, showing by example what the properly-working app will look like"
- **Do:** Show a designed empty state with message, example and call to action; Seed sample data on first load; Show examples rather than descriptions
- **Don't:** Show a totally blank page on first load; Show a table header with no rows and no message
- **Look at:** In the journey's declared empty state, find list or table containers with 0 data children; require a visible sentence inside or adjacent and at least one actionable element.
- **Unless:** Zero-hit search results need a message but no sample data; Transient loading states
- **Also stated as:** modern.every-state-is-designed (Vercel Labs); writing.empty-states-say-what-next (GitHub Primer); data-display.empty-data-explains-and-offers-next-step (IBM Carbon Design System); data-display.loading-skeleton-holds-the-layout (GitHub Primer); data-display.wrap-before-truncating-and-reveal-the-rest (GitHub Primer); feedback.match-the-indicator-to-the-wait (GitHub Primer).

## 13. `craft.fewer-borders`

Separate elements with space, a background shift, a shadow or striping before reaching for a border; too many borders make a design busy.

- **Source:** Adam Wathan & Steve Schoger, *Refactoring UI* — https://www.refactoringui.com/
- **In their words:** "Borders are a great way to distinguish two elements from one another, but using too many of them can make your design feel busy and cluttered."
- **Do:** Separate groups with space; Shift the background colour or add a shadow instead of a line; Zebra-stripe table rows instead of ruling them
- **Don't:** Use a 1px border as the default grouping device; Wrap a nav in a panel that only needs to recede; Rule every table row with a border when striping would do
- **Look at:** For every text node, count ancestors with a visible border, non-none box-shadow or outline; report max nesting depth and bordered boxes per viewport. Counted by `page.nesting`: `review check` refuses a `holds` it contradicts.
- **Unless:** Form inputs and the one object a person acts on keep their border; Keylines that make disconnected content feel connected; Decorative borders as style once the count is low
- **Also stated as:** canon.gestalt-common-region (Aurora Harley, NN/g); canon.rams-as-little-design-as-possible (Dieter Rams); modern.fewer-borders-more-space (Adam Wathan & Steve Schoger); canon.tufte-smallest-effective-difference (Edward Tufte); canon.tufte-one-plus-one-equals-three (Edward Tufte).

## 14. `craft.wcag-contrast-and-dont-rely-on-colour-alone`

Meet 4.5:1 for body text and 3:1 for headlines, prefer soft backgrounds with dark text, and never convey status by colour alone.

- **Source:** Erik D. Kennedy, *100 Things a UX/UI Designer Should Know* — https://www.learnui.design/blog/100-things-ux-ui-designer-know.html
- **In their words:** "The WCAG recommended contrast ratio for body text — 4.5:1 to meet AA standards"
- **Do:** Style coloured badges as a soft background with dark text; Pair every colour state with an icon or label
- **Don't:** Set white text on yellow, green or red fills that fail 4.5:1; Convey status by colour only
- **Look at:** Standard contrast ratio of computed text colour against effective background at 4.5:1 or 3:1 by size; status elements must carry a non-colour signal such as text or an icon.
- **Unless:** Disabled controls; Logos; Incidental text, per WCAG itself
- **Also stated as:** modern.contrast-and-not-colour-alone (Apple); color.never-the-only-signal (W3C Accessibility Guidelines Working Group); color.chart-marks-readable-without-hue (GitHub Primer); navigation.you-are-here (U.S. Web Design System (USWDS)); feedback.message-type-said-in-words (U.S. Web Design System).

## 15. `craft.spacing-and-sizing-system`

Draw every margin, padding and gap from one scale, and make space between groups clearly larger than space within them.

- **Source:** Steve Schoger, *Little UI Details (tweet, 13 Jul 2017)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "Using multiples to define your spacing is a great way to achieve vertical rhythm and provides a formula to justify your choices"
- **Do:** Take spacing from a ladder of multiples of 4; Make between-group gaps larger than within-group gaps
- **Don't:** Use one-off values such as 13px or 27px; Use equal gaps across a group boundary
- **Look at:** Collect all computed margin, padding and gap values above 0; report distinct values and how many are off a 4px grid; compare label-to-field gap with field-to-next-label gap.
- **Unless:** Optical adjustments on icons and hanging punctuation sit a pixel or two off-scale
- **Also stated as:** canon.rams-thorough-to-the-last-detail (Dieter Rams); modern.radii-are-few-and-concentric (Vercel Labs); modern.quality-is-a-choice-spec-is-the-floor (Karri Saarinen); modern.spacing-comes-from-a-scale (Stan Kirilov).

## 16. `craft.separation-order-space-then-lines-then-boxes`

Use the lightest separator that works: more space first, then a keyline or background band, and a box only for the object that is acted on.

- **Source:** Adam Wathan & Steve Schoger; Erik D. Kennedy, *Refactoring UI (fewer-borders tactic); 7 Rules for Creating Gorgeous UI, Part 1* — https://www.refactoringui.com/ (folklore: the wording is not verified)
- **Do:** Separate with whitespace by default; Add a keyline or background band only when space alone fails; Box only the object a person acts on
- **Don't:** Reach for a card or border first
- **Look at:** Between sibling groups, record which separator is used: gap at least 2x the inner gap (space), hr or border-bottom (line), bordered or shadowed wrapper (box); report the inner/outer gap ratio.
- **Unless:** Dense data such as tables where zebra stripes or keylines are used; Interactive cards that are the unit of action

## 17. `craft.align-with-readability-in-mind`

Keep few strong left edges, right-align comparable numbers with tabular figures, and hang punctuation so edges line up.

- **Source:** Steve Schoger, *Little UI Details (tweet, 15 Jun 2017)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "Aligning text is an easy way to clean up your design and make your content much more scannable."
- **Do:** Keep few, strong left edges; Right-align numeric columns with tabular figures; Hang bullets, icons and punctuation so text edges align
- **Don't:** Align a right-aligned image to ragged left-aligned text; Centre columns of numbers
- **Look at:** Count distinct left-edge x positions of text blocks in a container at 1px tolerance; for td cells matching a number or currency pattern, text-align must be right or end and tabular figures must be set.
- **Unless:** IDs, ZIP codes and phone numbers stay left-aligned; Centred layouts under 3 lines
- **Also stated as:** data-display.right-align-numbers-tabular-figures (GitHub Primer); data-display.text-left-headers-follow-their-column (W3C WAI (Eric Eggert, Shadi Abou-Zahra, eds.)).

## 18. `craft.de-emphasize-to-emphasize-up-pop-down-pop`

To emphasize, quiet the competitors as much as you loudify the hero; never stack every up-pop property on non-title elements.

- **Source:** Erik D. Kennedy, *7 Rules for Creating Gorgeous UI, Part 2* — https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-2.html
- **In their words:** "If an element needs emphasis, apply BOTH up-pop and down-pop styles — but slightly MORE up-pop."
- **Do:** Set big numbers light and lower-contrast; Set small labels uppercase and bold; Make the competitor quieter rather than the hero louder
- **Don't:** Stack big, bold, bright and uppercase on any element that is not the page title
- **Look at:** Flag text at 2x body size or more that is also font-weight 700+, full contrast and uppercase, when it is not the page h1.
- **Unless:** The page title may be all-out up-pop

## 19. `craft.hierarchy-is-everything-squint-test`

Squint: the most important thing must catch the eye first and the least important last; one element dominates each screen.

- **Source:** Erik D. Kennedy, *4 Rules for Intuitive UX* — https://www.learnui.design/blog/4-rules-intuitive-ux.html
- **In their words:** "If you squint your eyes, the Most Important Thing should catch your eye first – and the least important elements should catch your eye last."
- **Do:** Give each screen one dominant element; Emphasize the most-used functionality; De-emphasize, hide or remove the rarely used
- **Don't:** Make the primary action grey and unnoticeable beside a bigger, brighter Help; Render two identical grey buttons where one is the main action
- **Look at:** Given a declared primary action, score every interactive element as area x contrast x font-weight factor; the declared primary must rank first, and no set of buttons may sit within 10% of each other.
- **Unless:** Page titles are the only element styled all-out up-pop; A browsing page such as a gallery may have no single most important thing

## 20. `craft.greys-dont-have-to-be-grey-never-use-black`

Tint the neutral scale toward the brand hue and never use pure black for text.

- **Source:** Steve Schoger, *Little UI Details (tweet, 19 Mar 2018)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "'Grey' doesn't have to mean Grey™. Try saturating your greys with a bit of blue or brown for a cooler or warmer feel."
- **Do:** Tint the grey scale toward the brand hue; Raise saturation at the light and dark ends of the scale
- **Don't:** Use #000 for text; Use pure zero-saturation greys as the whole neutral palette
- **Look at:** Count text, border and background colours with saturation 0 and lightness under 15%, and the share of neutral swatches with saturation exactly 0.
- **Unless:** It does not always work; worth a trial; High-contrast or accessibility modes and print

## 21. `craft.type-scale-few-font-sizes`

Use about four font sizes from a fixed scale; reuse the default size for body, menus, lists and controls.

- **Source:** Erik D. Kennedy, *The Responsive Website Font Size Guidelines* — https://www.learnui.design/blog/mobile-desktop-website-font-size-guidelines.html
- **In their words:** "Even the most interaction-heavy pages can typically look just fine with about 4 font sizes total."
- **Do:** Use header, default, secondary (default minus 2px) and one wildcard size; Reuse the default size across body, menus, lists and controls
- **Don't:** Invent a new size per component; Apply a strict modular or golden-ratio scale to responsive pages
- **Look at:** Count distinct computed font-size values on visible text per viewport and how many fall outside the declared scale.
- **Unless:** Sizes must stay distinguishable, so large text may step many points apart; Marketing pages may add a display size

## 22. `canon.bringhurst-leading-is-a-rhythmic-unit`

The leading is the vertical unit; add and remove vertical space in multiples of it.

- **Source:** Robert Bringhurst, *The Elements of Typographic Style §2.2.1 / §2.2.2 (via webtypography.net)* — http://webtypography.net/2.2.1
- **In their words:** "You must choose not only the overall measure – the depth of the column or page – but also a basic rhythmical unit. This unit is the leading, which is the distance from one baseline to the next."
- **Do:** Use a unitless line-height such as 1.5; Make vertical margins multiples of the line-height
- **Don't:** Vertical spacing unrelated to the line unit; Line-height below 1 on running text
- **Look at:** Body line-height L; margins and paddings between text blocks as multiples of L (or L/2 if the lens allows).
- **Unless:** More leading for longer measures, darker faces, larger x-height and sans serifs: the ratio moves with the face
- **Also stated as:** canon.mb-grid-fields-from-columns-and-lines (Josef Müller-Brockmann).

## 23. `canon.tufte-small-multiples`

Compare with repeated same-scale panels, not one overloaded chart.

- **Source:** Edward Tufte, *Envisioning Information (1990), p.67* — https://www.antoinebuteau.com/lessons-from-edward-tufte/ (secondary)
- **In their words:** "At the heart of quantitative reasoning is a single question: Compared to what?"
- **Do:** Same width, height, axis domain and encoding across sibling panels; Index panels by category or time
- **Don't:** One chart with many overlaid series; Comparison panels with differing axis scales
- **Look at:** For sibling charts: equal size, equal axis domain (tick labels or scale attributes), same mark encoding. For one chart: number of overlaid series (more than 5 is a candidate).
- **Unless:** Different domains are legitimate when the comparison is of shape, not magnitude (inference, not Tufte's text)

## 24. `modern.no-junk-drawer-menus-or-unlabeled-icons`

Icons carry labels, menus are named for what they hold, and no primary feature hides under More or an ellipsis.

- **Source:** Jakob Nielsen (NN/G), *Top 10 Application-Design Mistakes* — https://www.nngroup.com/articles/top-10-application-design-mistakes/
- **In their words:** "most icons, unless they have a text label next to them, will be difficult or impossible for users to understand"
- **Do:** Labelled icons; Menus named for their contents; Inline help before tooltips
- **Don't:** More, ellipsis or Tools catch-alls holding primary features; Icon-only toolbars without labels; Tooltips on disabled buttons
- **Look at:** Icon-only buttons with no text and no aria-label fail; menus triggered by More, …, Tools or Options holding over 5 items or a primary-action label warn; disabled buttons with title or aria-describedby fail.
- **Unless:** Universally recognised icons in tight toolbars, though even the hamburger is weaker than designers think
- **Also stated as:** writing.buttons-name-the-action (IBM Carbon Design System); navigation.primary-nav-visible-on-wide-screens (GitHub Primer); usability.dont-make-me-think (Steve Krug); navigation.top-level-is-sections-not-a-site-map (GOV.UK Design System); craft.labels-are-a-last-resort (Steve Schoger (attendee notes by ynotdraw)).

## 25. `modern.frequent-actions-do-not-animate`

Actions used many times a day, and anything keyboard-triggered, appear instantly without an enter animation.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "Actions that are frequent and low in novelty should avoid extraneous animations: opening a right click menu, deleting or adding items from a list, hovering trivial buttons"
- **Do:** Show context menus, command palettes and list changes instantly; Leave keyboard-driven navigation unanimated
- **Don't:** Opacity and scale fades on controls used hundreds of times a day; Animating keyboard-initiated actions
- **Look at:** Enter animations on [role=menu], [cmdk-root] and newly inserted list items (animation-name not none), and animation state diffed within 16ms of a dispatched key; which actions count as frequent comes from the journey.
- **Unless:** macOS context menus fade out and blink the chosen item; Rare features may be theatrical (delight-impact curve)
- **Also stated as:** modern.motion-values-proportional-to-trigger (Rauno Freiberg); feedback.motion-duration-scales-with-size (IBM Carbon Design System).

## 26. `modern.numbers-and-text-do-not-shift-layout`

Numbers in columns and timers use tabular figures, images carry dimensions, and nothing changes weight on hover.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "tabular figures should be applied with `font-variant-numeric: tabular-nums`, particularly in tables or when layout shifts are undesirable, like in timers"
- **Do:** tabular-nums in tables, timers and prices; width and height on every img
- **Don't:** Proportional digits in columns; Images without dimensions; Weight changes on hover
- **Look at:** Numeric td cells whose computed font-variant-numeric lacks tabular-nums; img without width/height or aspect-ratio; sibling rect drift while a counter fixture runs.
- **Unless:** Prose numbers

## 27. `modern.delight-scales-with-rarity`

Spend delight on rare moments, keep daily actions plain, and never let an element visibly duplicate itself during a transition.

- **Source:** Benji Taylor, *Family Values* — https://benji.org/family-values
- **In their words:** "the potential for delight increases as the frequency of feature usage decreases"
- **Do:** Directional motion between tabs; Morphing labels such as Continue to Confirm; One action per tray
- **Don't:** Static jumps on core flows; Theatrical motion on daily actions; An element visibly duplicated mid-transition
- **Look at:** After a transition, count DOM nodes with the same key or text present twice on screen at once; frequency-weighted motion needs the journey to say what is frequent.
- **Unless:** Utility, performance and security come first; delight is selective emphasis

## 28. `modern.animate-only-transform-and-opacity`

Animate only transform and opacity, listing properties explicitly; never transition all or animate layout properties.

- **Source:** Emil Kowalski, *Great Animations* — https://emilkowal.ski/ui/great-animations
- **In their words:** "you should try to animate with `transform` and `opacity` as they only trigger the third rendering step (composite)"
- **Do:** Prefer CSS, then WAAPI, then JS for motion; Use clip-path for reveals; List transitioned properties explicitly
- **Don't:** transition: all; Animating width, height, top, left, margin or padding; Large blur() values on filter or backdrop-filter in motion
- **Look at:** Scan stylesheets and computed transition-property for all and for layout properties; scan @keyframes for width, height, top and left.
- **Unless:** Accordion height animation via grid-template-rows or interpolate-size is layout by nature and accepted when it is the only honest way

## 29. `modern.motion-has-an-origin`

A popover or menu animates from the side facing its trigger; set transform-origin where the motion physically starts.

- **Source:** Emil Kowalski, *Good vs Great Animations* — https://emilkowal.ski/ui/good-vs-great-animations
- **In their words:** "When we click on a button that opens a dropdown, we expect the dropdown to animate from where the button is"
- **Do:** Set transform-origin toward the trigger; Use the anchoring library's origin variable when one exists
- **Don't:** Popovers scaling from their own centre when anchored to a button
- **Look at:** For each open popover or menu with a known trigger (aria-controls or aria-haspopup), compare the computed transform-origin with the side facing the trigger.
- **Unless:** Centred modals have no anchor; a centred origin is right there

## 30. `modern.honour-prefers-reduced-motion`

Every large motion has a reduced variant under prefers-reduced-motion; fade instead of slide rather than ignoring the setting.

- **Source:** Emil Kowalski, *Great Animations* — https://emilkowal.ski/ui/great-animations
- **In their words:** "our animations need to account for people who don't want animations"
- **Do:** Provide a reduced variant such as a fade instead of a slide; Give autoplaying motion over five seconds pause, stop or hide controls
- **Don't:** Large translate or scale motion that ignores the media query
- **Look at:** Emulate prefers-reduced-motion: reduce and list elements whose computed animation-name or transition-property still includes translations over about 20px or durations above zero.
- **Unless:** Motion that is the content, such as a video or a chart drawing, is out of scope

## 31. `modern.animations-are-interruptible`

An open or close animation can be reversed mid-flight by the next input; nothing waits for a transition to finish.

- **Source:** Emil Kowalski, *Great Animations* — https://emilkowal.ski/ui/great-animations
- **In their words:** "Great animations are interruptible"
- **Do:** Use CSS transitions that reverse mid-flight, or spring libraries
- **Don't:** pointer-events: none locks while an animation plays; Keyframe-driven open and close that must finish before the next input
- **Look at:** Open a panel, immediately send the close input, sample the element's bounding box about 50ms later; if it is still growing the animation was not interruptible. Depends on timing tolerance.
- **Unless:** Destructive commits that fire only on gesture end are about triggering, not interruptibility

## 32. `modern.readable-type-sizes-and-weights`

Body text sits at the platform default size, weights stay 400 or heavier, and weight never changes on hover.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "Font weights below 400 should not be used"
- **Do:** 17px body on touch, 13px minimum on desktop UI; Weights between 400 and 700; Headings at weight 500–600; Minimise the number of typefaces
- **Don't:** Body text under 11pt; font-weight 300 or lower; Weight swaps on hover or selected state
- **Look at:** Computed font-size and font-weight of every text node at a phone viewport; count distinct font-family stacks and warn above 2.
- **Unless:** Captions and legal text may sit at the platform minimum; Display headings may use light weights at large sizes

## 33. `modern.focus-is-visible-and-unobscured`

Every focusable element shows a visible focus ring on :focus-visible, and no sticky or fixed element ever covers it.

- **Source:** Vercel Labs, *Web Interface Guidelines — AGENTS.md* — https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/AGENTS.md
- **In their words:** "NEVER: `outline: none` without visible focus replacement"
- **Do:** Style :focus-visible with box-shadow or outline plus outline-offset
- **Don't:** outline: none or 0 with no replacement; Focus rings hidden under sticky headers
- **Look at:** Tab through every focusable element; diff the focused and unfocused rect or read computed outline and box-shadow under :focus-visible; check the focused rect is not intersected by position fixed or sticky elements above it.

## 34. `modern.shadows-share-one-light-source`

All shadows on a page share one light direction and offset ratio, layered and tinted toward the background hue.

- **Source:** Josh W. Comeau, *Designing Beautiful Shadows in CSS* — https://www.joshwcomeau.com/css/designing-shadows/
- **In their words:** "every shadow on the page should share the same ratio"
- **Do:** A tokenised elevation scale; Two to five layered shadows; Shadow colour matched to the background hue
- **Don't:** Fuzzy grey boxes; Shadows with inconsistent x:y ratios across the page; Pure-black high-alpha shadows; Blurry borders used as separators
- **Look at:** Collect every computed box-shadow; fail when offset signs mix across the page or distinct shadow strings exceed about 6; warn when shadow hue is far from the background hue with alpha above 0.5.
- **Unless:** Inset shadows for sunken fields; Glows meant as glows

## 35. `modern.glass-and-blur-earn-their-place`

Translucency is for chrome over busy backgrounds with heavy blur and a contrast fallback, never for body content or decoration.

- **Source:** Megan Brown (NN/G), *Glassmorphism: Definition and Best Practices* — https://www.nngroup.com/articles/glassmorphism/
- **In their words:** "glassmorphism is best when utilized sparingly to create an illusion of depth"
- **Do:** Glass on toolbars and menus only; Heavy blur over intricate backgrounds; A solid fallback under increased contrast
- **Don't:** Glass cards for body content; Low blur over photos; Text whose contrast depends on what scrolls beneath it; Glass with a neon glow as decoration
- **Look at:** For each element with backdrop-filter, sample contained-text contrast against the composited background at three scroll positions; any under 4.5:1 fails; blur under 12px over an image warns; body text over 2 lines inside glass warns.
- **Unless:** OS-level materials that honour the user's Reduce Transparency setting

## 36. `modern.boring-and-familiar-beats-novel`

Reuse known controls, gestures and semantics; a novel interaction needs a standard alternative and a reason.

- **Source:** Scott Berkun, *The future of UI will be boring* — https://scottberkun.com/2010/the-future-of-ui-will-be-boring/
- **In their words:** "The rookie trap designers and technologists fall for is confusing cool with useful"
- **Do:** Native semantics and known gestures; An anchor for every link; Standard menus and selects
- **Don't:** Novel gestures without a tap or keyboard alternative; Custom scroll hijacking; Reinvented selects
- **Look at:** Custom widgets acting as select or menu with no role or keyboard handling fail; wheel or overscroll listeners calling preventDefault on document warn; drag-only affordances with no button alternative fail.
- **Unless:** Deliberate departures with a point of view in place before the first component went down

## 37. `modern.defaults-are-decisions-you-inherited`

A library or AI default is someone else's decision; commit to one written aesthetic direction instead of inheriting it.

- **Source:** hipuku, *The Default Is Not a Design Decision* — https://www.hipuku.dev/writing/the-default-is-not-a-design-decision
- **In their words:** "The default was always a design decision. Someone made it upstream, and everyone who builds on top inherits it without asking why."
- **Do:** A written token set such as DESIGN.md; One committed aesthetic direction; Semantic colour
- **Don't:** Untouched library defaults; Clean and modern as a brief; The AI-look constellation of purple gradient, Inter, identical cards, glass glow and bounce hover
- **Look at:** Score the constellation: purple-to-blue/cyan gradients warn, Inter or Roboto with no display face notes, 3+ identical icon+h3+p cards note, backdrop-filter plus glow notes, gradient text on numerals warns, overshoot cubic-bezier on hover warns.
- **Unless:** A purple brand is allowed to be purple; the tell is the constellation and the absence of a decision, not any one colour

## 38. `color.status-colours-keep-their-meaning`

Each status colour has one meaning across the product (critical for errors and blocked actions, warning for what needs attention, success for what went well, info for tips) and is never borrowed for promotion or decoration.

- **Source:** Shopify Polaris, *Colors: Palettes and roles (Critical, Success)* — https://polaris.shopify.com/design/colors/palettes-and-roles
- **In their words:** "Elements using critical must convey messaging that implies that an action is impossible, blocked, or has resulted in an error."
- **Do:** Map error, warning, success and info to named roles or tokens and use them only in those roles; Reserve the critical red for errors, blocked actions and destructive buttons; Use the info role, not warning or critical, for tips and announcements
- **Don't:** A sale or 'new' badge in the error red; Success green used to entice or to advertise an offer; Warning colour for 'coming soon' or 'under construction' messaging; Two different reds meaning error on different screens
- **Look at:** Find the colour the page uses for error text (an element with role=alert, aria-invalid's described-by message, or a class/token named error/critical/danger) and the success colour likewise. Count painted elements (text, fill or border) whose colour equals that error or success colour, within a ΔE of 3, and that are neither a validation message, an invalid field, a status badge of that meaning, nor a destructive action.
- **Unless:** Brand colours that happen to be red, as long as a separate, distinct error red is used for errors; Data visualisations where a series colour coincides with a status hue but no status is implied (prefer avoiding it)

## 39. `color.from-tokens-not-hex`

Every colour on the page comes from the design system's named tokens or palette functions, never from hex values copied into components.

- **Source:** GOV.UK Design System (Government Digital Service), *Styles: Colour* — https://design-system.service.gov.uk/styles/colour/
- **In their words:** "Do not copy the specific hexadecimal (hex) colour values."
- **Do:** Reference colour by role token (brand, text, error, border) rather than by value; Use palette colours (tints and shades of a few families) for supporting elements; Use a functional token only in the context it is designed for
- **Don't:** Hex literals in component styles; Near-duplicate colours (#1d70b8 next to #1d70b9) created by eye-dropping; Using the error token as a general red
- **Look at:** Collect every computed color, background-color, border-*-color, outline-color and fill/stroke of painted elements, and every value of CSS custom properties declared on :root (and on any theme selector). Count distinct painted colours that match no custom-property value (exact RGBA after resolution), and count pairs of painted colours closer than ΔE 2 that are not identical.
- **Unless:** Images, illustrations and embedded third-party widgets; Browser defaults on unstyled native controls; GOV.UK: palette colours (not functional ones) are allowed for illustrations and custom components
- **Also stated as:** color.mode-aware-tokens-in-every-theme (GitHub Primer).

## 40. `color.controls-and-graphics-3-to-1`

The parts that show a control is there and what state it is in (input borders, checkbox boxes and ticks, toggle tracks, icon-only buttons, meaningful chart marks) contrast at least 3:1 with the colours next to them.

- **Source:** W3C Accessibility Guidelines Working Group, *Understanding Success Criterion 1.4.11: Non-text Contrast (WCAG 2.2)* — https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- **In their words:** "Unless the control is inactive, any visual information provided that is necessary for a user to identify that a control is present and how to operate it must have a minimum 3:1 contrast ratio with the adjacent colors."
- **Do:** Input borders at 3:1 against the background the input sits on, or a filled input background at 3:1; Checkbox ticks and radio dots at 3:1 against the box; Standalone icons at 3:1 against their background; Avoid very thin lines that anti-alias below the nominal ratio
- **Don't:** Pale grey input borders (#ddd on white is about 1.4:1); A selected state shown only by a faint tint; Hover effects that lower a control's contrast with its surroundings
- **Look at:** For each visible input, select, textarea, checkbox, radio, [role=switch] and icon-only button (no visible text): compute the contrast ratio between the colour that identifies it (border colour, or its own background when it has no border, or the icon fill) and the background behind it; count those below 3:1, unrounded. Disabled controls are skipped.
- **Unless:** Inactive (disabled) controls are exempt; A control identified by its visible text needs no contrasting boundary; Logos and decorative graphics; Appearance determined by the browser and not modified by the author

## 41. `color.one-action-colour-apart-from-status`

Links and primary actions share one interactive colour family, used consistently, and that colour is not the colour of errors, warnings or success.

- **Source:** IBM Carbon Design System, *Elements: Color, Overview (Color anatomy)* — https://carbondesignsystem.com/elements/color/overview/
- **In their words:** "The core blue family serves as the primary action color across all IBM products and experiences. Additional colors are used sparingly and purposefully."
- **Do:** One link colour, used only for links; Primary buttons in the brand or action colour; Danger colour reserved for destructive buttons, not for the primary action
- **Don't:** Links in the error red; Primary buttons in several different hues across screens; Static text coloured like links
- **Look at:** Take the computed text colour of every a[href] in running text and the background of every primary (first, filled, or type=submit) button. Count distinct hues among them (30° bins), and count links or primary buttons whose colour is within ΔE 10 of the page's error, warning or success colour. Also count non-interactive text elements painted in the link colour.
- **Unless:** Primer (GitHub) deliberately uses the success role for primary buttons; a system that states such a mapping consistently is following its own rule; Destructive primary actions (Delete account) take the danger colour on purpose; Navigation menus, where position signals the link

## 42. `color.focus-ring-contrasts-with-its-surroundings`

The focus indicator contrasts at least 3:1 with whatever it is drawn against: the page background for an outer ring, the component's own colours for an inner one.

- **Source:** W3C Accessibility Guidelines Working Group, *Understanding Success Criterion 1.4.11: Non-text Contrast, Relationship with Focus Visible (WCAG 2.2)* — https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- **In their words:** "In combination with 2.4.7 Focus Visible, the visual focus indicator for a component must have sufficient contrast against the adjacent background when the component is focused, except where the appearance of the component is determined by the user agent and not modified by the author."
- **Do:** An outer ring that contrasts with the page background; A two-colour ring (dark and light) that holds on any background; A thick indicator rather than a 1px one
- **Don't:** A yellow outer ring on a white page; A focus border that changes hue inside the component without contrasting with its fill; Focus shown only by a background tint change
- **Look at:** Tab to each focusable control; diff the focused and unfocused screenshots of the control's box padded by a few pixels; for the changed pixels, take their colour and the colour of the unchanged pixels adjacent to them (page background outside, component fill inside). Count controls where no changed region reaches 3:1 against its adjacent colour. page.focus-visible checks only that some pixel changes; this checks that the change can be seen.
- **Unless:** Unmodified browser default focus styles; WCAG does not compare focused and unfocused states with each other; a background-only change is out of scope for 1.4.11 but fails Use of Color

## 43. `writing.one-label-per-action`

One concept, one word: controls that do the same thing carry the same label everywhere, and controls that do different things never share a label.

- **Source:** GitHub Primer, *Accessibility guide: Descriptive buttons, 'How to test names'* — https://primer.style/guides/accessibility/descriptive-buttons
- **In their words:** "When buttons perform the same action, they have the same name."
- **Do:** Keep a terminology list of preferred words and words not to use for the product; Pick one verb per action (Delete or Remove, not both for the same thing) and reuse it across pages; Add the object to disambiguate repeated actions ('Remove Apples', 'Remove Pears')
- **Don't:** Synonyms for one action across screens: 'Save' here, 'Update' there, 'Apply' elsewhere; Identical labels for different actions on the same page; Naming the same object two ways ('workspace' and 'project') in one product
- **Look at:** Across the journey's pages, collect (accessible name, action) pairs for buttons and links, where action is the form action/href/handler target. Count names that map to two or more different actions on one page, and actions reached by two or more different names across pages; also flag known synonym pairs present together (save/update/apply, delete/remove, sign in/log in, cart/basket). Count must be 0.
- **Unless:** Delete and Remove may coexist when they mean different things (destroy vs take out of a collection), as Carbon defines them — then each must be used only for its own meaning
- **Also stated as:** navigation.same-navigation-on-every-page (W3C WAI).

## 44. `writing.dates-numbers-units-for-the-reader`

Dates spell out the month, numbers are numerals with thousands separators, and units sit a space after their number — formatted in the reader's locale, never as an ambiguous all-numeric date or a raw machine value.

- **Source:** Shopify Polaris, *Content: Grammar and mechanics, 'Numbers, dates, and currency'* — https://polaris.shopify.com/content/grammar-and-mechanics
- **In their words:** "Use the month’s full name. If there isn’t enough space, use 3-letter abbreviations. Don’t write dates with numerals only."
- **Do:** 'December 11, 2024' or 'Dec 11, 2024' (in the reader's locale order); Numerals, not words: 'You have 5 orders to fulfill'; Thousands separators: '12,000'; A space between number and unit: '3.4 lb', '2 kg'; Currency code after the amount when currencies can be confused: '$10,000 USD'; Format with Intl.DateTimeFormat / Intl.NumberFormat for the user's locale
- **Don't:** All-numeric dates like '12/11/24'; ISO timestamps or epoch values shown raw ('2024-12-11T09:30:00Z'); Ordinals in dates ('January 23rd'); Unit glued to the number ('3.4lb'); Shortened numbers like '12 k' where the exact value matters
- **Look at:** Scan visible text nodes. Count matches of all-numeric dates (\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b), raw ISO timestamps (\d{4}-\d{2}-\d{2}T\d{2}:), integers of 5+ digits with no separator outside codes/IDs, and numbers glued to a unit (\d(kg|lb|cm|mm|km|mi|ml|oz)\b). Count must be 0.
- **Unless:** Polaris notes these are American English base rules and dates, numbers and measurements should be localized automatically — the target is the reader's locale, not US format; Identifiers, codes, SKUs and years are not quantities and take no separator; Dense data tables may use compact numeric dates if the format is unambiguous for the locale and stated in the column header

## 45. `data-display.no-tables-for-layout`

A table is for comparing data in rows and columns, never for arranging content on the page; layout belongs to the grid.

- **Source:** GOV.UK Design System (Government Digital Service), *Table — When not to use this component* — https://design-system.service.gov.uk/components/table/
- **In their words:** "Never use the table component to layout content on a page."
- **Do:** CSS grid or flex for page and dashboard layout; A list, cards or a summary list for items that do not share columns; Tables only where every row has the same fields
- **Don't:** A table that positions a sidebar, form or dashboard tiles; Table cells holding headings, paragraphs or whole forms; role=presentation on a table that actually holds tabular data
- **Look at:** Count table elements that have no th and either contain headings, more than one paragraph per cell, form fieldsets or nested tables, or have a single row whose cells hold unrelated content blocks.
- **Unless:** HTML email, where tables are still the only reliable layout tool
- **Also stated as:** modern.cards-are-a-choice-not-a-default (Stan Kirilov).

## 46. `data-display.chart-axes-and-bars-are-labelled`

Quantitative charts label both axes outside the data area in short plain words, and label each bar with what it shows and its value; past about six bars, use a table.

- **Source:** Shopify Polaris, *Data visualizations — Axis and labelling conventions; Horizontal bar charts* — https://polaris-react.shopify.com/design/data-visualizations
- **In their words:** "All standard charts that show quantitative data have 2 axes that should be labeled for clarity. … Label each bar with what it’s displaying, as well as the value."
- **Do:** Axis titles naming the measure and its unit; Direct labels on or beside each bar, outside the bar when it is too short; Tick labels skipped at regular intervals rather than crammed or slanted; Short standard abbreviations: 'Feb', '10 Apr', '1.2k'; A legend only when there is more than one series (Primer)
- **Don't:** Unlabelled axes or units only in a tooltip; Slanted tick labels squeezed in to fit; A bar chart of dozens of categories where a table would compare them better
- **Look at:** For each chart, count value or category axes with no visible title or unit text, bars or points with no visible label or value (where there are six or fewer), tick labels rotated away from horizontal, and horizontal bar charts with more than six bars.
- **Unless:** Sparklines and small multiples that share labelled axes with a neighbour; Interactive charts where exact values sit in a tooltip, provided the axes still carry titles and units
- **Also stated as:** canon.tufte-data-ink-ratio (Edward Tufte); canon.tufte-forgo-chartjunk (Edward Tufte).

## 47. `data-display.chart-axes-are-honest`

Bar and area charts start their value axis at zero; line charts may crop the axis to show change; gaps in the data are shown as gaps, never interpolated.

- **Source:** IBM Carbon Design System, *Data visualization — Axes and labels* — https://carbondesignsystem.com/data-visualization/axes-and-labels/
- **In their words:** "Always start numerical axes at zero for part-to-whole and comparisons charts, such as bar and area chart. … Never interpolate between periods when data is unavailable."
- **Do:** A zero baseline on bar, column and area charts; A cropped y-axis only on line and scatter charts, where the trend is the message; Labelled start and end points around a gap in a time series; An explicit axis-break mark when part of an axis is skipped
- **Don't:** Bars rising from a non-zero baseline; A line drawn straight across missing periods; Changing tick increments to hide missing data
- **Look at:** For each bar, column or area chart (SVG or canvas with an accessible data table or chart library config), count those whose value-axis minimum is not 0 for all-positive data; for each time-series line, count runs where a missing period is bridged by a continuous segment.
- **Unless:** Line charts and scatter plots, where Carbon allows a non-zero start because the trend matters more than relative size; Log-scale charts, which have no zero and must say they are log scale
- **Also stated as:** color.chart-palette-fits-the-data (IBM Carbon Design System); canon.tufte-graphical-integrity (Edward Tufte).

## 48. `data-display.long-tables-sort-and-say-so`

Long tables let users sort the columns that have a natural order, start with one column sorted, and expose the sort state to assistive technology.

- **Source:** U.S. Web Design System (GSA), *Table — Usability guidance* — https://designsystem.digital.gov/components/table/
- **In their words:** "Enable sort where useful. Add row sorting to individual columns of long tables where the data can be logically ordered either alphabetically or numerically."
- **Do:** Sort controls as buttons inside the th of sortable columns; One column sorted on load, shown with an arrow and aria-sort on its th (Primer); A polite live region that announces the new sort (USWDS); A filter or search field above long tables, and pagination for very large sets
- **Don't:** Long tables with no sort, filter or pagination; A sort state shown only by an icon with no aria-sort; Row sorting on tables with merged (colspan/rowspan) cells
- **Look at:** Count tables with more than 20 body rows (or with pagination) that have no sort control in any th and no filter/search input associated with them; among sortable tables, count those where no th carries aria-sort other than none.
- **Unless:** Short tables a user takes in at a glance; Tables whose row order is itself the meaning (a ranked list, a timetable) may fix the order
- **Also stated as:** navigation.pagination-says-where-and-how-many (U.S. Web Design System (USWDS)).

## 49. `data-display.one-unit-and-format-per-column`

Every value in a column uses the same unit, precision and format; the unit is named once in the header, not repeated in each cell.

- **Source:** U.S. Web Design System (GSA), *Table — Usability guidance* — https://designsystem.digital.gov/components/table/
- **In their words:** "Predictably format columns. Take care not to vary units or formatting within the same column. Instead, normalize values so they can be easily compared."
- **Do:** Normalise a column to one unit (all days, not days and weeks); Keep the same number of decimal places in every row of a column; Put the unit or symbol in the column header ('Temperature °C') rather than in every cell; Use one date format and one thousands separator throughout the table
- **Don't:** Mixing '3 days' and '2 weeks' in one column; '12.5', '12.50' and '12.500' in the same column; Abbreviating some values ('1.2k') and not others in the same column
- **Look at:** For each column of numeric td, count distinct decimal-place counts, distinct unit suffixes or prefixes, and distinct date formats; any column with more than one is a failure.
- **Unless:** A column deliberately mixing magnitudes where the unit changes are labelled per cell and sorting is by underlying value — rare, and worth questioning

## 50. `data-display.header-cells-are-th-with-scope`

A data table marks its header cells as th and its data cells as td; when headers run both across and down, scope (or id/headers in complex tables) ties each cell to its headers.

- **Source:** W3C WAI (Eric Eggert, Shadi Abou-Zahra, eds.), *Tables Tutorial* — https://www.w3.org/WAI/tutorials/tables/
- **In their words:** "Header cells must be marked up with <th>, and data cells with <td> to make tables accessible. For more complex tables, explicit associations may be needed using scope, id, and headers attributes."
- **Do:** A thead row of th scope=col in every data table; th scope=row for the first cell when it names the row's item; id and headers attributes when a cell sits under more than one level of header; A caption that names the table
- **Don't:** Header rows built from td styled bold; Div grids that look like tables with no role=table/row/columnheader/cell semantics; One table holding several topics separated by extra rows of th
- **Look at:** Count table (and role=table/grid) elements that have more than one row of data and no th / role=columnheader; count tables with both a header row and a header column whose th lack scope; count tables with no caption, aria-label or aria-labelledby.
- **Unless:** A simple table with one header row needs only th, not scope; scope matters once there are header rows and header columns; Layout tables, which should not exist (see data-display.no-tables-for-layout)

## 51. `data-display.summary-list-for-key-value-facts`

A set of facts about one thing — label and value pairs — is shown as a summary list (dl with dt and dd), not as a table with no headers or as loose text.

- **Source:** GOV.UK Design System (Government Digital Service), *Summary list — When to use / When not to use this component* — https://design-system.service.gov.uk/components/summary-list/
- **In their words:** "Use a summary list to show information as a list of key facts. … only use it to present information that has a key and at least one value."
- **Do:** dl with dt (the key) and dd (the value) for record details, metadata and check-your-answers pages; A row action ('Change') whose accessible name includes the key ('Change name'); Headings or cards to separate several summary lists on one page
- **Don't:** A two-column table without th used to show one record's fields; Key–value pairs set as 'Label: value' runs in a paragraph; A summary list for genuinely tabular data or a plain list of items
- **Look at:** Where the screen shows the fields of a single record (a profile, an order, an item's metadata, a check-answers page), are the label–value pairs marked up as dl/dt/dd with each key visually distinct from its value — and is tabular data comparing several records in a table rather than a summary list?
- **Unless:** Two or three facts inside a card may be inline text if they are not scanned as a set

## 52. `navigation.tabs-switch-views-in-one-context`

Tabs switch between related views of one context: they sit directly above the content they change, exactly one is selected, and a tab set never mixes tabs that load a URL with tabs that toggle a panel; they are not site navigation and not steps.

- **Source:** GitHub Primer, *Navigation (UI pattern)* — https://primer.style/product/ui-patterns/navigation/
- **In their words:** "Activating a tab may or may not change the URL, but you can't mix tabs that change the URL with tabs just switch the visible tab panel."
- **Do:** Either all items are links to distinct URLs (an underline nav with aria-current) or all are role=tab controlling a role=tabpanel; One tab selected by default when the page loads; The tab row directly above the panel it changes; Views that can be visited in any order, each complete enough that the user need not switch back and forth
- **Don't:** A tab row in which some items toggle a panel and one jumps to another page; Tabs used as the site's primary navigation; Tabs for the steps of a process, or for content the user must compare side by side; More than two levels of tabs
- **Look at:** For each tablist or tab-styled row of links: does exactly one item carry aria-selected="true" or aria-current? Are the items either all <a href> to distinct URLs or all role=tab with aria-controls pointing at an existing role=tabpanel? Is the controlled panel (or main content) the next block below the row, with no other interactive element between them? Is the row nested inside at most one other tab row?
- **Unless:** Sources disagree on filtered views of one list: Polaris puts them in tabs ('a list-view with different filters applied'); Carbon sends filtering to a content switcher; Primer's underline nav wants discrete content, not formats of the same content; GOV.UK: without JavaScript and on small screens its tabs render as one page with a contents list; that passes; GOV.UK warns that tabs hide content and not everyone notices them; consider headings on one page first

## 53. `navigation.skip-link-is-the-first-tab-stop`

The first Tab press on every page lands on a visible 'Skip to main content' link that moves focus past the header and navigation into main.

- **Source:** GOV.UK Design System, *Skip link component* — https://design-system.service.gov.uk/components/skip-link/
- **In their words:** "Including the skip link component gives users the option to bypass the top-level navigation links and jump to the main content on a page."
- **Do:** The skip link immediately after <body> (or after a cookie banner); Visually hidden until it receives keyboard focus, then clearly shown; A target id on <main> (or its first heading) that can take focus; Breadcrumbs and back links placed before <main>, so the skip link skips them too
- **Don't:** A page whose first Tab stop is the logo or the first of a dozen nav links; A skip link that stays invisible when focused; A skip link whose href points at an id that does not exist; A skip link wrapped in <nav> or moved inside the header
- **Look at:** Load the page and press Tab once: is document.activeElement an <a> whose href is '#id' of an element that is main or inside main, with a non-zero box inside the viewport and opacity above 0? Press Enter, then Tab: is focus on an element inside main?
- **Unless:** WCAG 2.4.1 is met by other means too (landmarks, headings); the first-Tab test follows GOV.UK and Carbon practice and is stricter than the criterion; WCAG: when the repeated navigation is at the bottom of the page, a skip link may be unnecessary; A page with no repeated block before main (a bare single-purpose page) has nothing to skip

## 54. `feedback.toasts-carry-nothing-critical`

A toast is only for a short, low-priority confirmation of something the user just did; an error that needs action, a warning, or anything the user cannot find again elsewhere goes in an inline message or banner that stays.

- **Source:** Shopify Polaris, *Toast component — Accessibility* — https://polaris.shopify.com/components/deprecated/toast
- **In their words:** "Avoid using toast for critical information that merchants need to act on immediately."
- **Do:** Short noun + verb confirmations: 'Product updated', 'Collection added'; Errors the user must fix shown next to the cause or in a banner that persists until resolved; Whatever the toast says also visible somewhere on the page after it goes (the saved value, the item in the list, a notifications area)
- **Don't:** A validation or payment error delivered only as a toast that auto-dismisses; A toast that holds the only copy of a generated password, link or code; Several sentences of explanation in a toast
- **Look at:** Record a walk through every action, including forced failures (offline, 4xx, 5xx). Treat as a toast any fixed- or absolute-positioned element with role=status|alert or aria-live that is removed or hidden within 15 s without user input. Count toasts whose text matches error/failed/could not/denied/invalid, toasts with more than 15 words, and toasts whose distinctive text (any token of 6+ characters other than common words) appears nowhere in the DOM 2 s after they leave. Count must be 0.
- **Unless:** Polaris allows an error toast for system errors not caused by the user, such as 'Internet disconnected', in 3 words; Polaris's own Toast component is deprecated in favour of the App Bridge Toast API; the guidance quoted is still on its page; The 15 s, 15-word and 6-character thresholds are uxcli's
