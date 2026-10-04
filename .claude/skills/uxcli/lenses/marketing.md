# Marketing pages — the `marketing` lens

Landing, pricing and feature pages: read once, persuade, one call to action.

45 viewpoints from named designers. Answer every one for the screen you are looking at: `holds` with where, `breaks` with where and what, `n/a` with why. The sequence, the review file and `uxcli review check` are in `../references/lenses.md`. The rules are the designers', not uxcli's and not yours.

## 1. `usability.fitts-target-size-and-distance`

Make targets big, space them apart, and put them where the pointer already is; touch targets at least 1 cm square.

- **Source:** Aurora Harley, NN/g, *Touch Targets on Touchscreens (2019)* — https://www.nngroup.com/articles/touch-target-size/ (study)
- **In their words:** "at least 1cm × 1cm (0.4in x 0.4in)"
- **Do:** Make targets big; Give icons labels so the label extends the target; Keep ample spacing between targets; Put the call to action near the final form fields
- **Don't:** Pack icon-only 24 px controls edge to edge on touch layouts; Crowd targets
- **Look at:** Bounding box of each interactive element at the mobile viewport (1 cm ≈ 38 CSS px; 24/44 px are the usual proxies); centre-to-centre spacing; distance from last input to submit; label inside the clickable box.
- **Unless:** Infinite targets along screen edges for mouse — size matters less at an edge; Primary CTAs, moving users, children and the elderly need larger than the minimum
- **Also stated as:** usability.hicks-fewer-choices-when-time-matters (Jon Yablonski (Laws of UX)); usability.von-restorff-one-emphasis (GOV.UK Design System); craft.growth-design-psychology-principles (Growth.Design (Dan Benoni, Louis-Xavier Lavallée)); modern.no-deceptive-patterns (Harry Brignull).

## 2. `usability.speak-the-users-language`

Write in the words the actor already uses; no internal jargon, error codes or unexplained abbreviations.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #2* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "The design should speak the users' language. Use words, phrases, and concepts familiar to the user, rather than internal jargon."
- **Do:** Use words the user understands without looking them up; Spell acronyms out in full on each page; Write 'for example', not 'eg' or 'ie'
- **Don't:** Show bare error codes; Expose internal entity names; Use unexplained abbreviations
- **Look at:** Flag bare error codes (e.g. ERR-422, Error 0x…), all-caps acronyms not defined on the page, and Latin abbreviations; whether a term is jargon for this actor needs the journey's actor.
- **Unless:** Expert-only tools where the domain term is the users' language — match the user, do not simplify per se
- **Also stated as:** writing.plain-language-reading-level (Shopify Polaris).

## 3. `usability.signifiers-make-clickable-look-clickable`

Links and buttons must look clickable — colour, underline, border or fill — because weak signifiers cost measured time and fixations.

- **Source:** Kate Moran, NN/g, *Flat UI Elements Attract Less Attention and Cause Uncertainty (2017)* — https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/ (study)
- **In their words:** "22% more time"
- **Do:** Make links stand out from body text; Make buttons resemble physical buttons with rectangular shapes; Apply consistent treatment throughout the site; Provide signifiers rather than rely on affordances
- **Don't:** Style linked text as static text; Use ghost buttons as the default; Use disabled buttons if avoidable; Rely on a label to say that a control is a control
- **Look at:** For each a[href], button, [role=button]: computed colour, underline, border and background versus surrounding text; a link matching body colour with no underline and no other differentiator is weak; count disabled buttons.
- **Unless:** Link position in nav menus or peripheral lists may eliminate the need for underlining (Loranger); Flat works best with low information density, traditional layouts and high-contrast targets positioned standardly (Moran)
- **Also stated as:** modern.signifiers-survive-flatness (Kate Moran (NN/G)); modern.no-dead-zones-and-honest-clickability (Rauno Freiberg).

## 4. `usability.omit-needless-words`

Cut word count by half: no happy-talk intros, no instruction paragraphs before forms, no marketese, sentence case everywhere.

- **Source:** Jakob Nielsen, *How Users Read on the Web (1997)* — https://www.nngroup.com/articles/how-users-read-on-the-web/ (study)
- **In their words:** "People rarely read Web pages word by word; instead, they scan the page"
- **Do:** Reduce word count by half compared to traditional writing; Limit paragraphs to one idea each; Use sentence case everywhere except proper nouns
- **Don't:** Open with welcome or happy talk; Put instruction paragraphs before forms; Use promotional language ('marketese'); Set labels in ALL CAPS or Title Case
- **Look at:** Word count between a form's heading and its first input; word count of blocks starting 'Welcome' or 'Thank you for'; buttons and labels in all caps or Title Case; sentence count in instructions.
- **Unless:** Nielsen also asks for outbound links to build trust — brevity is not zero text
- **Also stated as:** writing.sentence-case-ui-text (IBM Carbon Design System).

## 5. `usability.minimalist-no-competing-information`

Everything on the screen competes with the primary goal; remove what does not serve it so the main action stays visible.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #8* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "Every extra unit of information in an interface competes with the relevant units of information and diminishes their relative visibility."
- **Do:** Prioritise content and features that support the primary goal; Keep the primary action in the first viewport; Let the small screen force focus on what matters
- **Don't:** Let decorative elements distract; Let secondary content outweigh the primary action
- **Look at:** At 360 px: count distinct interactive elements above the fold; whether the journey's primary action is within the first viewport; count of elements sharing the accent colour.
- **Unless:** Dense expert dashboards where the irreducible information is large
- **Also stated as:** forms.ask-only-what-you-need (GOV.UK Design System).

## 6. `usability.mindless-clicks-not-fewer-clicks`

Do not count clicks; make each one an unambiguous choice with clear link text that says where it goes.

- **Source:** Steve Krug, *Don't Make Me Think, Revisited — chapter 4 (Krug's Second Law of Usability)* — https://ptgmedia.pearsoncmg.com/images/9780321965516/samplepages/0321965515.pdf
- **In their words:** "It doesn't matter how many times I have to click, as long as each click is a mindless, unambiguous choice."
- **Do:** Write link text that identifies its target; Use breadcrumbs and hub pages for scent; Keep clear labelling with strong information scent
- **Don't:** Count clicks as the metric; Use generic links like 'Click here' or 'Learn more'
- **Look at:** Count links and buttons whose text is generic ('Click here', 'Learn more', 'Read more', bare 'Next') or duplicates another link's text with a different target; do not measure path length.
- **Unless:** Fewer clicks matter more when the same path is drilled repeatedly or pages take long to load (Krug)
- **Also stated as:** writing.links-describe-their-destination (Mailchimp).

## 7. `usability.banner-blindness-dont-style-content-like-ads`

Keep essential content and the primary action in the main column, styled like content, never in a right rail, top strip or animated coloured box.

- **Source:** Kara Pernice, NN/g, *Banner Blindness Revisited (2018)* — https://www.nngroup.com/articles/banner-blindness-old-and-new-findings/ (study)
- **In their words:** "Users have learned to ignore content that resembles ads, is close to ads, or appears in locations traditionally dedicated to ads."
- **Do:** Put essential content in the main column; Style key notices like content
- **Don't:** Put the primary CTA in the right rail or a top banner strip; Give a key notice animation, coloured background or fancy formatting; Place essential content next to real ads
- **Look at:** Is the journey's primary action or a required notice positioned in the right rail (x > 70% of desktop viewport) or in a full-width top strip with background fill and animation?
- **Unless:** On mobile, large inline ads do get fixated — the effect is weaker for inline placement
- **Also stated as:** modern.honour-prefers-reduced-motion (Emil Kowalski); feedback.moving-content-can-be-paused (W3C Accessibility Guidelines Working Group).

## 8. `usability.visual-hierarchy-for-scanning`

Design for scanning, not reading: headings that out-rank body text, bold key phrases, lists, and no walls of unformatted text.

- **Source:** Kara Pernice, NN/g, *F-Shaped Pattern of Reading on the Web (2017, rev. 2026)* — https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/ (study)
- **In their words:** "The F-shaped scanning pattern is bad for users and businesses."
- **Do:** Use prominent headings with information-rich opening words; Bold key phrases; employ lists and bullets; Remove unnecessary content
- **Don't:** Leave walls of unstructured text; Let headings fail to out-rank body text visually; Let visual weight contradict importance
- **Look at:** Heading font-size and weight monotonic with level (h1 ≥ h2 ≥ h3 ≥ body); longest paragraph in words; ratio of headings and list items to total text blocks.
- **Unless:** The pattern needs moderate, not high, interest — highly motivated readers read
- **Also stated as:** craft.hierarchy-is-everything-squint-test (Erik D. Kennedy).

## 9. `usability.no-false-affordances`

Nothing that is not interactive may look interactive: no underlined or blue static text, no button-shaped badges, no pointer cursor on inert elements.

- **Source:** Hoa Loranger, NN/g, *Beyond Blue Links: Making Clickable Elements Recognizable (2015)* — https://www.nngroup.com/articles/clickable-elements/
- **In their words:** "Avoid making non-clickable items (like headings) resemble buttons."
- **Do:** Reserve link colour and underline for links; Reserve button shape and fill for buttons
- **Don't:** Give static items hyperlink colours; Underline non-interactive text; Make headings or badges resemble buttons
- **Look at:** Elements with no href, handler, role or tabindex that have cursor: pointer, underline plus link colour, or a button-like box (border-radius, filled background, short centred text).

## 10. `usability.follow-conventions`

Work the way the sites and platforms users already know; a convention beats a locally optimised novelty.

- **Source:** Jakob Nielsen, *OK-Cancel or Cancel-OK? (2008)* — https://www.nngroup.com/articles/ok-cancel-or-cancel-ok/
- **In their words:** "Following platform conventions is more important than optimizing an individual dialog box."
- **Do:** Keep button order identical in every dialog; Highlight the most common button as default, except for dangerous actions; Prefer descriptive labels over 'OK'; Let users keep a familiar version for a while when changing
- **Don't:** Invent a new pattern for a solved problem; Vary the same control's placement between screens
- **Look at:** Logo in header links home; a search input has type=search or a search label; primary/secondary button order is the same in every dialog; cart and account icons stay where they were on other screens.
- **Unless:** Desktop apps follow their own OS: Windows OK-first, Apple OK-last
- **Also stated as:** modern.boring-and-familiar-beats-novel (Scott Berkun).

## 11. `usability.aesthetic-usability-effect-bias`

Polish makes a screen look more usable than it is; discount your aesthetic impression and run the measurable checks first.

- **Source:** Kate Moran, NN/g, *The Aesthetic-Usability Effect (2024, rev. 2026)* — https://www.nngroup.com/articles/aesthetic-usability-effect/ (study)
- **In their words:** "Users' tendency to perceive attractive products as more usable. People tend to believe that things that look better will work better — even if they aren't actually more effective or efficient."
- **Do:** Rate your own screen after the measurable checks, not before; Treat polish as tolerance for minor problems only
- **Don't:** Read polish as usability; Let an attractive surface hide a usability problem
- **Look at:** Did the evaluator judge the screen usable because it looks good? Re-check the verdict against the count-kind entries before trusting it; 'attractive' is the variable and stays taste.
- **Unless:** With severe usability issues, or functionality sacrificed for aesthetics, users lose patience

## 12. `usability.natural-mapping-and-proximity`

Put a control next to the thing it changes and a label next to its field; gaps between groups must exceed gaps within them.

- **Source:** Marieke McCloskey, NN/g, *Form Design Quick Fix: Group Form Elements Effectively Using White Space (2013)* — https://www.nngroup.com/articles/form-design-white-space/
- **In their words:** "items near each other appear related"
- **Do:** Place labels as close to their fields as possible; Group related fields together; Place related targets close to each other; Put the call to action near the final form fields
- **Don't:** Put a control far from the thing it changes; Separate groups by less space than their members
- **Look at:** Distance from each label to its own input versus the nearest other input; gap within a fieldset versus gap between fieldsets; distance from last input to the submit button.
- **Unless:** Left-aligned labels are acceptable if space is constrained and labels are of similar length

## 13. `usability.start-with-user-needs-design-with-data`

Name the actor and their need before drawing a screen, then let measured behaviour, not hunches or looks, decide what changes.

- **Source:** GDS / GOV.UK, *Government Design Principles, principles 1, 3 and 4* — https://www.gov.uk/guidance/government-design-principles
- **In their words:** "Service design starts with identifying user needs. If you don't know what the user needs are, you won't build the right thing."
- **Do:** State the actor and need before the screen; Measure real behaviour; Start small and iterate
- **Don't:** Design to a hunch; Design to an aesthetic
- **Look at:** Does the journey name its actor and need (uxcli context show), and is the design decision traceable to observed behaviour rather than a hunch or a look?

## 14. `craft.fewer-borders`

Separate elements with space, a background shift, a shadow or striping before reaching for a border; too many borders make a design busy.

- **Source:** Adam Wathan & Steve Schoger, *Refactoring UI* — https://www.refactoringui.com/
- **In their words:** "Borders are a great way to distinguish two elements from one another, but using too many of them can make your design feel busy and cluttered."
- **Do:** Separate groups with space; Shift the background colour or add a shadow instead of a line; Zebra-stripe table rows instead of ruling them
- **Don't:** Use a 1px border as the default grouping device; Wrap a nav in a panel that only needs to recede; Rule every table row with a border when striping would do
- **Look at:** For every text node, count ancestors with a visible border, non-none box-shadow or outline; report max nesting depth and bordered boxes per viewport. Counted by `page.nesting`: `review check` refuses a `holds` it contradicts.
- **Unless:** Form inputs and the one object a person acts on keep their border; Keylines that make disconnected content feel connected; Decorative borders as style once the count is low
- **Also stated as:** canon.gestalt-common-region (Aurora Harley, NN/g); canon.rams-as-little-design-as-possible (Dieter Rams); canon.vignelli-white-space-is-the-silence (Massimo Vignelli); modern.fewer-borders-more-space (Adam Wathan & Steve Schoger); canon.tufte-one-plus-one-equals-three (Edward Tufte); craft.separation-order-space-then-lines-then-boxes (Adam Wathan & Steve Schoger; Erik D. Kennedy).

## 15. `craft.spacing-and-sizing-system`

Draw every margin, padding and gap from one scale, and make space between groups clearly larger than space within them.

- **Source:** Steve Schoger, *Little UI Details (tweet, 13 Jul 2017)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "Using multiples to define your spacing is a great way to achieve vertical rhythm and provides a formula to justify your choices"
- **Do:** Take spacing from a ladder of multiples of 4; Make between-group gaps larger than within-group gaps
- **Don't:** Use one-off values such as 13px or 27px; Use equal gaps across a group boundary
- **Look at:** Collect all computed margin, padding and gap values above 0; report distinct values and how many are off a 4px grid; compare label-to-field gap with field-to-next-label gap.
- **Unless:** Optical adjustments on icons and hanging punctuation sit a pixel or two off-scale
- **Also stated as:** canon.rams-thorough-to-the-last-detail (Dieter Rams); modern.radii-are-few-and-concentric (Vercel Labs); modern.quality-is-a-choice-spec-is-the-floor (Karri Saarinen); modern.spacing-comes-from-a-scale (Stan Kirilov).

## 16. `craft.wcag-contrast-and-dont-rely-on-colour-alone`

Meet 4.5:1 for body text and 3:1 for headlines, prefer soft backgrounds with dark text, and never convey status by colour alone.

- **Source:** Erik D. Kennedy, *100 Things a UX/UI Designer Should Know* — https://www.learnui.design/blog/100-things-ux-ui-designer-know.html
- **In their words:** "The WCAG recommended contrast ratio for body text — 4.5:1 to meet AA standards"
- **Do:** Style coloured badges as a soft background with dark text; Pair every colour state with an icon or label
- **Don't:** Set white text on yellow, green or red fills that fail 4.5:1; Convey status by colour only
- **Look at:** Standard contrast ratio of computed text colour against effective background at 4.5:1 or 3:1 by size; status elements must carry a non-colour signal such as text or an icon.
- **Unless:** Disabled controls; Logos; Incidental text, per WCAG itself
- **Also stated as:** modern.contrast-and-not-colour-alone (Apple); color.never-the-only-signal (W3C Accessibility Guidelines Working Group); navigation.you-are-here (U.S. Web Design System (USWDS)).

## 17. `craft.de-emphasize-to-emphasize-up-pop-down-pop`

To emphasize, quiet the competitors as much as you loudify the hero; never stack every up-pop property on non-title elements.

- **Source:** Erik D. Kennedy, *7 Rules for Creating Gorgeous UI, Part 2* — https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-2.html
- **In their words:** "If an element needs emphasis, apply BOTH up-pop and down-pop styles — but slightly MORE up-pop."
- **Do:** Set big numbers light and lower-contrast; Set small labels uppercase and bold; Make the competitor quieter rather than the hero louder
- **Don't:** Stack big, bold, bright and uppercase on any element that is not the page title
- **Look at:** Flag text at 2x body size or more that is also font-weight 700+, full contrast and uppercase, when it is not the page h1.
- **Unless:** The page title may be all-out up-pop
- **Also stated as:** canon.tufte-smallest-effective-difference (Edward Tufte).

## 18. `craft.tap-targets-and-control-height`

Touch targets are at least 44×44; inputs and the buttons beside them share one height of 40 or 48px.

- **Source:** Erik D. Kennedy, *100 Things a UX/UI Designer Should Know* — https://www.learnui.design/blog/100-things-ux-ui-designer-know.html
- **In their words:** "The minimum tap target size on both iOS and Android — On iOS: 44x44pt. On Android: 48x48pt."
- **Do:** Give touch viewports hit areas of 44×44 or more; Match button height to the inputs beside it
- **Don't:** Use 26px-wide grid cells as targets; Make buttons shorter than the inputs they sit beside
- **Look at:** At 375px, getBoundingClientRect of every a, button, input and role=button: fail under 44 in width or height (under 24 for inline text links); in a form row, button and input heights within 2px.
- **Unless:** Inline text links in running prose; Dense desktop-only tools if the project commits to no touch
- **Also stated as:** modern.hit-targets-meet-platform-minimums (Apple).

## 19. `craft.start-with-too-much-whitespace`

Start with far more breathing room than feels necessary and remove it until it works; browser-default spacing is the largest mistake.

- **Source:** Erik D. Kennedy, *7 Rules for Creating Gorgeous UI, Part 1* — https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-1.html
- **In their words:** "To make UI that looks designed, add a lot of breathing room. … Sometimes a ridiculous amount."
- **Do:** Pad controls at least the text's own height; Space list and nav items twice the text height; Separate groups with much more space than sits within them
- **Don't:** Ship browser-default spacing with everything smashed toward the top
- **Look at:** Ratio of vertical padding to font-size on list items, nav items and buttons; ratio of gap between groups to gap within a group.
- **Unless:** Dense professional, interaction-heavy tools may compress, but spacing must stay consistent

## 20. `craft.type-scale-few-font-sizes`

Use about four font sizes from a fixed scale; reuse the default size for body, menus, lists and controls.

- **Source:** Erik D. Kennedy, *The Responsive Website Font Size Guidelines* — https://www.learnui.design/blog/mobile-desktop-website-font-size-guidelines.html
- **In their words:** "Even the most interaction-heavy pages can typically look just fine with about 4 font sizes total."
- **Do:** Use header, default, secondary (default minus 2px) and one wildcard size; Reuse the default size across body, menus, lists and controls
- **Don't:** Invent a new size per component; Apply a strict modular or golden-ratio scale to responsive pages
- **Look at:** Count distinct computed font-size values on visible text per viewport and how many fall outside the declared scale.
- **Unless:** Sizes must stay distinguishable, so large text may step many points apart; Marketing pages may add a display size
- **Also stated as:** canon.bringhurst-compose-with-a-scale (Robert Bringhurst).

## 21. `craft.button-hierarchy-one-primary`

One filled brand-colour button per view; secondaries outlined, tertiaries as text, destructive actions quiet with a confirmation step.

- **Source:** Steve Schoger, *Little UI Details (tweet, 2 Aug 2017)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "You want your primary button to stand out much more than your secondary / danger actions."
- **Do:** Fill exactly one button per view or dialog in the brand colour; Outline secondary actions and set tertiary actions as text; Keep destructive actions quiet unless they are the primary job
- **Don't:** Let a green button compete with the primary; Put a big red Delete beside a small Save; Colour every link brand blue
- **Look at:** Classify buttons as filled, outlined or text from computed style; fail if a view or dialog has more than one filled button of distinct hues, or a delete-labelled button is filled while the confirming action is not.
- **Unless:** Segmented or toggle groups; Toolbars of equal-weight actions; A page whose only job is the destructive action, where red is primary

## 22. `craft.text-on-images-needs-consistent-contrast`

Put an overlay, scrim, box, blur or floor fade between photo and text, and test legibility at every viewport.

- **Source:** Erik D. Kennedy, *7 Rules for Creating Gorgeous UI, Part 2* — https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-2.html
- **In their words:** "There are only a few ways of reliably and beautifully overlaying text on images"
- **Do:** Place an overlay, gradient or scrim between the photo and the text; Test legibility at every screen size
- **Don't:** Set raw text on an un-darkened photo; Rely on a photo's out-of-focus area that moves when the image changes
- **Look at:** For text stacked over an img or background-image, sample painted pixels behind each glyph box from a screenshot; fail if minimum contrast is under 3:1 or the contrast spread across the box exceeds a threshold.
- **Unless:** Decorative text that is not read, such as watermarks; A fixed, dark, low-contrast image
- **Also stated as:** modern.glass-and-blur-earn-their-place (Megan Brown (NN/G)).

## 23. `craft.greys-dont-have-to-be-grey-never-use-black`

Tint the neutral scale toward the brand hue and never use pure black for text.

- **Source:** Steve Schoger, *Little UI Details (tweet, 19 Mar 2018)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "'Grey' doesn't have to mean Grey™. Try saturating your greys with a bit of blue or brown for a cooler or warmer feel."
- **Do:** Tint the grey scale toward the brand hue; Raise saturation at the light and dark ends of the scale
- **Don't:** Use #000 for text; Use pure zero-saturation greys as the whole neutral palette
- **Look at:** Count text, border and background colours with saturation 0 and lightness under 15%, and the share of neutral swatches with saturation exactly 0.
- **Unless:** It does not always work; worth a trial; High-contrast or accessibility modes and print

## 24. `craft.line-height-tightens-as-text-grows`

Line height is proportional: tighten it as text gets larger and loosen it as lines get longer.

- **Source:** Steve Schoger, *Little UI Details (tweet, 27 Feb 2018)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "1.5 may work great for body copy, but as text gets larger, your line-height should get tighter."
- **Do:** Set headings around 1.1–1.25 and body around 1.5; Give longer measures more leading
- **Don't:** Inherit one line-height:1.5 onto 40px headlines; Set line-height:1 on paragraphs
- **Look at:** For each text element compute line-height divided by font-size; the ratio on headlines at 2x body or larger must be smaller than the body ratio.
- **Unless:** Single-line headings where line height is invisible; No one-size-fits-all number; assert direction only

## 25. `canon.vignelli-few-typefaces`

Use one or two established typeface families per work; structure carries the design, not the type.

- **Source:** Massimo Vignelli, *The Vignelli Canon, Typefaces, The Basic Ones (p.54)* — https://www.rit.edu/vignellicenter/sites/rit.edu.vignellicenter/files/documents/The%20Vignelli%20Canon.pdf
- **In their words:** "In reality the number of good typefaces is rather limited … Personally, I can get along well with a half a dozen, to which I can add another half a dozen, but probably no more."
- **Do:** Use one family, plus monospace for code; Carry hierarchy through structure rather than typeface change
- **Don't:** Mix a display serif, a geometric sans, a system sans and a rounded sans on one page; Distort type; Use expressive type to mime the message
- **Look at:** Distinct rendered font-family first choices across visible text nodes, ignoring icon fonts and code.
- **Unless:** A specific type design may be appropriate for a logo or short promotional text in ephemeral or promotional contexts
- **Also stated as:** modern.readable-type-sizes-and-weights (Rauno Freiberg).

## 26. `canon.bringhurst-leading-is-a-rhythmic-unit`

The leading is the vertical unit; add and remove vertical space in multiples of it.

- **Source:** Robert Bringhurst, *The Elements of Typographic Style §2.2.1 / §2.2.2 (via webtypography.net)* — http://webtypography.net/2.2.1
- **In their words:** "You must choose not only the overall measure – the depth of the column or page – but also a basic rhythmical unit. This unit is the leading, which is the distance from one baseline to the next."
- **Do:** Use a unitless line-height such as 1.5; Make vertical margins multiples of the line-height
- **Don't:** Vertical spacing unrelated to the line unit; Line-height below 1 on running text
- **Look at:** Body line-height L; margins and paddings between text blocks as multiples of L (or L/2 if the lens allows).
- **Unless:** More leading for longer measures, darker faces, larger x-height and sans serifs: the ratio moves with the face

## 27. `canon.butterick-line-spacing-120-145`

Body line-height is 1.2–1.45 times the font size.

- **Source:** Matthew Butterick, *Practical Typography, Summary of key rules* — https://practicaltypography.com/summary-of-key-rules.html
- **In their words:** "Line spacing should be 120–145% of the point size."
- **Do:** Set line-height 1.2–1.45 on paragraphs
- **Don't:** Line-height 1.0–1.15 on running text; Line-height above 1.5 on running text
- **Look at:** line-height divided by font-size for each paragraph.
- **Unless:** Headlines and short lines are outside body line spacing; Vignelli's print ratios (1.08–1.14) are print-only; every situation may require a different ratio

## 28. `canon.gestalt-closure`

Let something cross the fold or the container edge so the eye knows more continues.

- **Source:** Alita Kendrick, NN/g, *The Principle of Closure (2021-07-18)* — https://www.nngroup.com/articles/principle-closure/
- **In their words:** "People will fill in blanks to perceive a complete object whenever an external stimulus partially matches that object."
- **Do:** Show a partial next item in scrollers and carousels; Let the next section's heading peek above the fold; Label simplified icons
- **Don't:** A section boundary landing exactly on the fold; Cut-offs too small to read as continuing
- **Look at:** At each named viewport: an element crossing the viewport bottom edge; for horizontal scrollers, the last visible item extending past the container edge by a lens-set number of px.
- **Unless:** Works less well when viewport sizes are unpredictable; Icons still need labels and testing

## 29. `modern.no-junk-drawer-menus-or-unlabeled-icons`

Icons carry labels, menus are named for what they hold, and no primary feature hides under More or an ellipsis.

- **Source:** Jakob Nielsen (NN/G), *Top 10 Application-Design Mistakes* — https://www.nngroup.com/articles/top-10-application-design-mistakes/
- **In their words:** "most icons, unless they have a text label next to them, will be difficult or impossible for users to understand"
- **Do:** Labelled icons; Menus named for their contents; Inline help before tooltips
- **Don't:** More, ellipsis or Tools catch-alls holding primary features; Icon-only toolbars without labels; Tooltips on disabled buttons
- **Look at:** Icon-only buttons with no text and no aria-label fail; menus triggered by More, …, Tools or Options holding over 5 items or a primary-action label warn; disabled buttons with title or aria-describedby fail.
- **Unless:** Universally recognised icons in tight toolbars, though even the hamburger is weaker than designers think
- **Also stated as:** writing.buttons-name-the-action (IBM Carbon Design System); navigation.primary-nav-visible-on-wide-screens (GitHub Primer); usability.dont-make-me-think (Steve Krug); navigation.top-level-is-sections-not-a-site-map (GOV.UK Design System).

## 30. `modern.interactions-feel-immediate-under-200ms`

Interaction transitions run 200ms or less with an ease-out curve so the interface feels immediate.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "Animation duration should not be more than 200ms for interactions to feel immediate"
- **Do:** Keep interaction transitions at 200ms or less, never above 300ms; Use ease-out for entering elements; Use a custom cubic-bezier instead of the built-in curves
- **Don't:** Slow transitions on hover, focus, open and close; Bounce or elastic easing on everyday controls; ease-in on an entering element
- **Look at:** Computed transition-duration and animation-duration on elements that change on :hover, :focus, [aria-expanded] or [data-state]; flag any over 300ms, warn over 200ms; ease-in on an entering element fails.
- **Unless:** Toasts may run slower with a plain ease on purpose for tone; Large page or scene transitions and decorative loops sit outside the interaction budget; Exit animations can be a bit more relaxed
- **Also stated as:** modern.motion-values-proportional-to-trigger (Rauno Freiberg); feedback.motion-duration-scales-with-size (IBM Carbon Design System).

## 31. `modern.animate-only-transform-and-opacity`

Animate only transform and opacity, listing properties explicitly; never transition all or animate layout properties.

- **Source:** Emil Kowalski, *Great Animations* — https://emilkowal.ski/ui/great-animations
- **In their words:** "you should try to animate with `transform` and `opacity` as they only trigger the third rendering step (composite)"
- **Do:** Prefer CSS, then WAAPI, then JS for motion; Use clip-path for reveals; List transitioned properties explicitly
- **Don't:** transition: all; Animating width, height, top, left, margin or padding; Large blur() values on filter or backdrop-filter in motion
- **Look at:** Scan stylesheets and computed transition-property for all and for layout properties; scan @keyframes for width, height, top and left.
- **Unless:** Accordion height animation via grid-template-rows or interpolate-size is layout by nature and accepted when it is the only honest way

## 32. `modern.motion-has-an-origin`

A popover or menu animates from the side facing its trigger; set transform-origin where the motion physically starts.

- **Source:** Emil Kowalski, *Good vs Great Animations* — https://emilkowal.ski/ui/good-vs-great-animations
- **In their words:** "When we click on a button that opens a dropdown, we expect the dropdown to animate from where the button is"
- **Do:** Set transform-origin toward the trigger; Use the anchoring library's origin variable when one exists
- **Don't:** Popovers scaling from their own centre when anchored to a button
- **Look at:** For each open popover or menu with a known trigger (aria-controls or aria-haspopup), compare the computed transform-origin with the side facing the trigger.
- **Unless:** Centred modals have no anchor; a centred origin is right there

## 33. `modern.mobile-inputs-do-not-zoom-or-trap`

Inputs are at least 16px on phones, never autofocus on touch, and the page never disables zoom or blocks paste.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "Font size for inputs should not be smaller than 16px to prevent iOS zooming on focus"
- **Do:** Set type, inputmode and autocomplete on every input; Use touch-action: manipulation on controls
- **Don't:** Viewport meta with user-scalable=no; Paste handlers that preventDefault; autofocus at phone widths
- **Look at:** Computed font-size of input, select and textarea at a 390px viewport under 16px; viewport meta containing user-scalable=no; paste handlers that preventDefault; [autofocus] present at phone width.
- **Unless:** Desktop-only admin tools; Autofocus on desktop with a single primary input

## 34. `modern.focus-is-visible-and-unobscured`

Every focusable element shows a visible focus ring on :focus-visible, and no sticky or fixed element ever covers it.

- **Source:** Vercel Labs, *Web Interface Guidelines — AGENTS.md* — https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/AGENTS.md
- **In their words:** "NEVER: `outline: none` without visible focus replacement"
- **Do:** Style :focus-visible with box-shadow or outline plus outline-offset
- **Don't:** outline: none or 0 with no replacement; Focus rings hidden under sticky headers
- **Look at:** Tab through every focusable element; diff the focused and unfocused rect or read computed outline and box-shadow under :focus-visible; check the focused rect is not intersected by position fixed or sticky elements above it.

## 35. `modern.numbers-and-text-do-not-shift-layout`

Numbers in columns and timers use tabular figures, images carry dimensions, and nothing changes weight on hover.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "tabular figures should be applied with `font-variant-numeric: tabular-nums`, particularly in tables or when layout shifts are undesirable, like in timers"
- **Do:** tabular-nums in tables, timers and prices; width and height on every img
- **Don't:** Proportional digits in columns; Images without dimensions; Weight changes on hover
- **Look at:** Numeric td cells whose computed font-variant-numeric lacks tabular-nums; img without width/height or aspect-ratio; sibling rect drift while a counter fixture runs.
- **Unless:** Prose numbers

## 36. `modern.shadows-share-one-light-source`

All shadows on a page share one light direction and offset ratio, layered and tinted toward the background hue.

- **Source:** Josh W. Comeau, *Designing Beautiful Shadows in CSS* — https://www.joshwcomeau.com/css/designing-shadows/
- **In their words:** "every shadow on the page should share the same ratio"
- **Do:** A tokenised elevation scale; Two to five layered shadows; Shadow colour matched to the background hue
- **Don't:** Fuzzy grey boxes; Shadows with inconsistent x:y ratios across the page; Pure-black high-alpha shadows; Blurry borders used as separators
- **Look at:** Collect every computed box-shadow; fail when offset signs mix across the page or distinct shadow strings exceed about 6; warn when shadow hue is far from the background hue with alpha above 0.5.
- **Unless:** Inset shadows for sunken fields; Glows meant as glows

## 37. `modern.defaults-are-decisions-you-inherited`

A library or AI default is someone else's decision; commit to one written aesthetic direction instead of inheriting it.

- **Source:** hipuku, *The Default Is Not a Design Decision* — https://www.hipuku.dev/writing/the-default-is-not-a-design-decision
- **In their words:** "The default was always a design decision. Someone made it upstream, and everyone who builds on top inherits it without asking why."
- **Do:** A written token set such as DESIGN.md; One committed aesthetic direction; Semantic colour
- **Don't:** Untouched library defaults; Clean and modern as a brief; The AI-look constellation of purple gradient, Inter, identical cards, glass glow and bounce hover
- **Look at:** Score the constellation: purple-to-blue/cyan gradients warn, Inter or Roboto with no display face notes, 3+ identical icon+h3+p cards note, backdrop-filter plus glow notes, gradient text on numerals warns, overshoot cubic-bezier on hover warns.
- **Unless:** A purple brand is allowed to be purple; the tell is the constellation and the absence of a decision, not any one colour

## 38. `color.from-tokens-not-hex`

Every colour on the page comes from the design system's named tokens or palette functions, never from hex values copied into components.

- **Source:** GOV.UK Design System (Government Digital Service), *Styles: Colour* — https://design-system.service.gov.uk/styles/colour/
- **In their words:** "Do not copy the specific hexadecimal (hex) colour values."
- **Do:** Reference colour by role token (brand, text, error, border) rather than by value; Use palette colours (tints and shades of a few families) for supporting elements; Use a functional token only in the context it is designed for
- **Don't:** Hex literals in component styles; Near-duplicate colours (#1d70b8 next to #1d70b9) created by eye-dropping; Using the error token as a general red
- **Look at:** Collect every computed color, background-color, border-*-color, outline-color and fill/stroke of painted elements, and every value of CSS custom properties declared on :root (and on any theme selector). Count distinct painted colours that match no custom-property value (exact RGBA after resolution), and count pairs of painted colours closer than ΔE 2 that are not identical.
- **Unless:** Images, illustrations and embedded third-party widgets; Browser defaults on unstyled native controls; GOV.UK: palette colours (not functional ones) are allowed for illustrations and custom components

## 39. `color.one-action-colour-apart-from-status`

Links and primary actions share one interactive colour family, used consistently, and that colour is not the colour of errors, warnings or success.

- **Source:** IBM Carbon Design System, *Elements: Color, Overview (Color anatomy)* — https://carbondesignsystem.com/elements/color/overview/
- **In their words:** "The core blue family serves as the primary action color across all IBM products and experiences. Additional colors are used sparingly and purposefully."
- **Do:** One link colour, used only for links; Primary buttons in the brand or action colour; Danger colour reserved for destructive buttons, not for the primary action
- **Don't:** Links in the error red; Primary buttons in several different hues across screens; Static text coloured like links
- **Look at:** Take the computed text colour of every a[href] in running text and the background of every primary (first, filled, or type=submit) button. Count distinct hues among them (30° bins), and count links or primary buttons whose colour is within ΔE 10 of the page's error, warning or success colour. Also count non-interactive text elements painted in the link colour.
- **Unless:** Primer (GitHub) deliberately uses the success role for primary buttons; a system that states such a mapping consistently is following its own rule; Destructive primary actions (Delete account) take the danger colour on purpose; Navigation menus, where position signals the link

## 40. `color.focus-ring-contrasts-with-its-surroundings`

The focus indicator contrasts at least 3:1 with whatever it is drawn against: the page background for an outer ring, the component's own colours for an inner one.

- **Source:** W3C Accessibility Guidelines Working Group, *Understanding Success Criterion 1.4.11: Non-text Contrast, Relationship with Focus Visible (WCAG 2.2)* — https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- **In their words:** "In combination with 2.4.7 Focus Visible, the visual focus indicator for a component must have sufficient contrast against the adjacent background when the component is focused, except where the appearance of the component is determined by the user agent and not modified by the author."
- **Do:** An outer ring that contrasts with the page background; A two-colour ring (dark and light) that holds on any background; A thick indicator rather than a 1px one
- **Don't:** A yellow outer ring on a white page; A focus border that changes hue inside the component without contrasting with its fill; Focus shown only by a background tint change
- **Look at:** Tab to each focusable control; diff the focused and unfocused screenshots of the control's box padded by a few pixels; for the changed pixels, take their colour and the colour of the unchanged pixels adjacent to them (page background outside, component fill inside). Count controls where no changed region reaches 3:1 against its adjacent colour. page.focus-visible checks only that some pixel changes; this checks that the change can be seen.
- **Unless:** Unmodified browser default focus styles; WCAG does not compare focused and unfocused states with each other; a background-only change is out of scope for 1.4.11 but fails Use of Color

## 41. `color.few-families-in-proportion`

Use a few colour families in a deliberate proportion (neutral base dominant, then primary, secondary and a small accent), not an even spread of many hues.

- **Source:** U.S. Web Design System (GSA), *Design tokens: Theme color tokens* — https://designsystem.digital.gov/design-tokens/color/theme-tokens/
- **In their words:** "about 60% of your site’s color would be the primary color family, about 30% would be the secondary color family, and about 10% would be the accent color families"
- **Do:** Neutral base for text and most surfaces; One primary family carrying most of the colour, one secondary, a small accent; Additional colours used sparingly and for a purpose (Carbon); Start in black and white, then add colour to support the message (USWDS)
- **Don't:** Five or more saturated hue families at similar weight on one screen; An accent that covers more area than the primary; A new hue introduced for a single component
- **Look at:** Screenshot the page and bucket every non-neutral pixel (HSL saturation above about 15%) by hue into 30° bins, ignoring images and status colours. How many hue families take more than 2% of the coloured area, and does the largest one carry most of it while the smallest (accent) stays near a tenth?
- **Unless:** USWDS: the proportions are for non-base colours; neutral text will usually dominate; Illustration, photography and data visualisation, which need their own palettes; Brands whose identity is multi-hue

## 42. `data-display.no-tables-for-layout`

A table is for comparing data in rows and columns, never for arranging content on the page; layout belongs to the grid.

- **Source:** GOV.UK Design System (Government Digital Service), *Table — When not to use this component* — https://design-system.service.gov.uk/components/table/
- **In their words:** "Never use the table component to layout content on a page."
- **Do:** CSS grid or flex for page and dashboard layout; A list, cards or a summary list for items that do not share columns; Tables only where every row has the same fields
- **Don't:** A table that positions a sidebar, form or dashboard tiles; Table cells holding headings, paragraphs or whole forms; role=presentation on a table that actually holds tabular data
- **Look at:** Count table elements that have no th and either contain headings, more than one paragraph per cell, form fieldsets or nested tables, or have a single row whose cells hold unrelated content blocks.
- **Unless:** HTML email, where tables are still the only reliable layout tool
- **Also stated as:** modern.cards-are-a-choice-not-a-default (Stan Kirilov).

## 43. `forms.autocomplete-names-the-purpose`

Every field that asks about the user — name, email, phone, address, postcode, birthday, card — carries the matching autocomplete token so browsers and assistive tech can fill and label it.

- **Source:** W3C Web Accessibility Initiative, *Understanding WCAG 2.2 Success Criterion 1.3.5: Identify Input Purpose* — https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html
- **In their words:** "Use code to indicate the purpose of common inputs, where technology allows."
- **Do:** autocomplete='name' or 'given-name' and 'family-name' on name fields; 'email', 'tel', 'postal-code', 'street-address' or 'address-line1', 'bday-day'/'bday-month'/'bday-year'; 'shipping' and 'billing' section tokens on order forms; autocomplete='off' on the form, if needed, while each field still declares its purpose
- **Don't:** autocomplete='off' on personal fields with no purpose token; Personal-data fields with no autocomplete attribute; A token that does not match the field (email token on a phone field)
- **Look at:** For every input, select and textarea whose label matches name, email, phone, address, postcode/ZIP, city, country, date of birth, card number or expiry: count those whose autocomplete attribute is missing, 'off', or not a WCAG input-purpose token that matches the label.
- **Unless:** Fields about someone other than the user (a recipient's email) are outside 1.3.5; A field that accepts either username or email may carry one token or none

## 44. `navigation.skip-link-is-the-first-tab-stop`

The first Tab press on every page lands on a visible 'Skip to main content' link that moves focus past the header and navigation into main.

- **Source:** GOV.UK Design System, *Skip link component* — https://design-system.service.gov.uk/components/skip-link/
- **In their words:** "Including the skip link component gives users the option to bypass the top-level navigation links and jump to the main content on a page."
- **Do:** The skip link immediately after <body> (or after a cookie banner); Visually hidden until it receives keyboard focus, then clearly shown; A target id on <main> (or its first heading) that can take focus; Breadcrumbs and back links placed before <main>, so the skip link skips them too
- **Don't:** A page whose first Tab stop is the logo or the first of a dozen nav links; A skip link that stays invisible when focused; A skip link whose href points at an id that does not exist; A skip link wrapped in <nav> or moved inside the header
- **Look at:** Load the page and press Tab once: is document.activeElement an <a> whose href is '#id' of an element that is main or inside main, with a non-zero box inside the viewport and opacity above 0? Press Enter, then Tab: is focus on an element inside main?
- **Unless:** WCAG 2.4.1 is met by other means too (landmarks, headings); the first-Tab test follows GOV.UK and Carbon practice and is stricter than the criterion; WCAG: when the repeated navigation is at the bottom of the page, a skip link may be unnecessary; A page with no repeated block before main (a bare single-purpose page) has nothing to skip

## 45. `navigation.same-navigation-on-every-page`

Navigation that repeats across pages keeps the same items, in the same order and place, with the same names and icons on every page; sub-navigation may expand within it.

- **Source:** W3C WAI, *Understanding SC 3.2.3 Consistent Navigation* — https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html
- **In their words:** "Consistently order navigation that repeats across multiple pages."
- **Do:** One header and footer component rendered on every page, not a hand-built copy per page; The same accessible name for the same nav item, search control and account control everywhere (WCAG 3.2.4); Header icons in fixed positions, so they do not shift between screens
- **Don't:** Nav items that reorder, appear or disappear depending on the page (apart from the current section expanding); 'Sign in' on one page and 'Log in' on the next for the same control; The search field in the header on some pages and the footer on others
- **Look at:** Visit three or more pages that share a header. On each, read the ordered accessible names of the links and buttons in the header nav, the footer nav and the header tools. Are the lists identical, apart from expanded sub-items of the current section? At one viewport, is each landmark's bounding box at the same x and y?
- **Unless:** WCAG 3.2.4 lets a label vary with context when the function is recognisably the same ('Page 4' read as 'Previous page' from page 5); A change of order the user asked for (a preference, an adaptive user agent) is allowed; Comparing bounding boxes at one viewport is uxcli's test; WCAG asks for the same relative order
