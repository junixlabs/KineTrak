# Shop and catalogue — the `shop` lens

Catalogues, search results and product pages: browse, compare, choose.

65 viewpoints from named designers. Answer every one for the screen you are looking at: `holds` with where, `breaks` with where and what, `n/a` with why. The sequence, the review file and `uxcli review check` are in `../references/lenses.md`. The rules are the designers', not uxcli's and not yours.

## 1. `usability.visibility-of-system-status`

Every action with consequences shows the user something changed, as quickly as possible, so they always know what the system is doing.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #1* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "The design should always keep users informed about what is going on, through appropriate feedback within a reasonable amount of time."
- **Do:** Show a visible trace of every state change; Give feedback immediately, or as quickly as possible; Disable and label a control while its action runs
- **Don't:** Submit silently; Change state with no visible trace; Show an action's result only somewhere else
- **Look at:** Drive an action, then diff DOM or pixels over the next frames: did anything visibly change within 1 s; is there a live region, status text, spinner or busy state?
- **Unless:** Below 0.1 s no special feedback is needed beyond showing the result
- **Also stated as:** modern.feedback-is-local-and-optimistic (Rauno Freiberg); modern.density-is-value-per-time-and-space (Matthew Ström-Awn); writing.success-names-what-happened (Shopify Polaris); data-display.loading-skeleton-holds-the-layout (GitHub Primer); forms.do-not-disable-the-submit-button (GitHub Primer); feedback.status-messages-announced-without-focus (W3C Accessibility Guidelines Working Group); feedback.confirmation-page-says-what-happens-next (GOV.UK Design System).

## 2. `usability.feedback-within-a-second`

Paint something within 0.1 s; keep the user's flow with a response under 1 s; show a progress indicator for anything longer.

- **Source:** Jakob Nielsen, *Response Times: The 3 Important Limits (1993)* — https://www.nngroup.com/articles/response-times-3-important-limits/ (study)
- **In their words:** "0.1 second is about the limit for having the user feel that the system is reacting instantaneously … 1.0 second is about the limit for the user's flow of thought to stay uninterrupted"
- **Do:** Use a progress indicator for any action over about 1 s; Use a looped indicator for 2–9 s waits; Use a percent-done indicator for 10 s or more
- **Don't:** Leave dead time with no indicator; Show a percent-done bar that lies badly
- **Look at:** Time from input event to first paint of any change; presence of a progress element, aria-busy, <progress> or role=status update when the wait exceeds 1 s.
- **Unless:** Laws of UX claims a purposeful delay can raise perceived value — an opinion with no study cited
- **Also stated as:** modern.interactions-feel-immediate-under-200ms (Rauno Freiberg); feedback.match-the-indicator-to-the-wait (GitHub Primer).

## 3. `usability.speak-the-users-language`

Write in the words the actor already uses; no internal jargon, error codes or unexplained abbreviations.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #2* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "The design should speak the users' language. Use words, phrases, and concepts familiar to the user, rather than internal jargon."
- **Do:** Use words the user understands without looking them up; Spell acronyms out in full on each page; Write 'for example', not 'eg' or 'ie'
- **Don't:** Show bare error codes; Expose internal entity names; Use unexplained abbreviations
- **Look at:** Flag bare error codes (e.g. ERR-422, Error 0x…), all-caps acronyms not defined on the page, and Latin abbreviations; whether a term is jargon for this actor needs the journey's actor.
- **Unless:** Expert-only tools where the domain term is the users' language — match the user, do not simplify per se
- **Also stated as:** writing.errors-say-what-and-how-to-fix (GOV.UK Design System (Government Digital Service)); writing.plain-language-reading-level (Shopify Polaris); forms.error-message-says-how-to-fix (GOV.UK Design System); modern.quality-is-a-choice-spec-is-the-floor (Karri Saarinen); navigation.top-level-is-sections-not-a-site-map (GOV.UK Design System).

## 4. `usability.signifiers-make-clickable-look-clickable`

Links and buttons must look clickable — colour, underline, border or fill — because weak signifiers cost measured time and fixations.

- **Source:** Kate Moran, NN/g, *Flat UI Elements Attract Less Attention and Cause Uncertainty (2017)* — https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/ (study)
- **In their words:** "22% more time"
- **Do:** Make links stand out from body text; Make buttons resemble physical buttons with rectangular shapes; Apply consistent treatment throughout the site; Provide signifiers rather than rely on affordances
- **Don't:** Style linked text as static text; Use ghost buttons as the default; Use disabled buttons if avoidable; Rely on a label to say that a control is a control
- **Look at:** For each a[href], button, [role=button]: computed colour, underline, border and background versus surrounding text; a link matching body colour with no underline and no other differentiator is weak; count disabled buttons.
- **Unless:** Link position in nav menus or peripheral lists may eliminate the need for underlining (Loranger); Flat works best with low information density, traditional layouts and high-contrast targets positioned standardly (Moran)
- **Also stated as:** usability.banner-blindness-dont-style-content-like-ads (Kara Pernice, NN/g); craft.button-hierarchy-one-primary (Steve Schoger); canon.gestalt-similarity (Aurora Harley, NN/g); color.one-action-colour-apart-from-status (IBM Carbon Design System).

## 5. `usability.fitts-target-size-and-distance`

Make targets big, space them apart, and put them where the pointer already is; touch targets at least 1 cm square.

- **Source:** Aurora Harley, NN/g, *Touch Targets on Touchscreens (2019)* — https://www.nngroup.com/articles/touch-target-size/ (study)
- **In their words:** "at least 1cm × 1cm (0.4in x 0.4in)"
- **Do:** Make targets big; Give icons labels so the label extends the target; Keep ample spacing between targets; Put the call to action near the final form fields
- **Don't:** Pack icon-only 24 px controls edge to edge on touch layouts; Crowd targets
- **Look at:** Bounding box of each interactive element at the mobile viewport (1 cm ≈ 38 CSS px; 24/44 px are the usual proxies); centre-to-centre spacing; distance from last input to submit; label inside the clickable box.
- **Unless:** Infinite targets along screen edges for mouse — size matters less at an edge; Primary CTAs, moving users, children and the elderly need larger than the minimum
- **Also stated as:** craft.tap-targets-and-control-height (Erik D. Kennedy); craft.growth-design-psychology-principles (Growth.Design (Dan Benoni, Louis-Xavier Lavallée)); modern.hit-targets-meet-platform-minimums (Apple).

## 6. `usability.von-restorff-one-emphasis`

One visually distinct primary action per view, left-aligned with the form, and distinguished by more than colour.

- **Source:** GOV.UK Design System, *Button component* — https://design-system.service.gov.uk/components/button/
- **In their words:** "Avoid using multiple default buttons on a single page. Having more than one main call to action reduces their impact, and makes it harder for users to know what to do next."
- **Do:** Make key actions visually distinctive; Use restraint so emphases do not compete; Align the primary button to the left edge of the form; Highlight the default, except for dangerous actions
- **Don't:** Put two or more filled primary buttons in one view; Signal emphasis by colour alone
- **Look at:** Cluster interactive elements by computed background, border and weight; the most emphatic cluster per view must have one member; primary's left edge aligns with the inputs; emphasis differs in weight, fill or border, not colour only.
- **Unless:** Do not pre-highlight a dangerous action as the default (Nielsen)
- **Also stated as:** canon.vignelli-weight-for-function-not-volume (Massimo Vignelli).

## 7. `usability.hicks-fewer-choices-when-time-matters`

Fewer equal-weight choices at a decision point, with one recommended; but never use seven as a cap on menu length.

- **Source:** Jon Yablonski (Laws of UX), *Hick's Law — Laws of UX* — https://lawsofux.com/hicks-law/ (study)
- **In their words:** "The time it takes to make a decision increases with the number and complexity of choices."
- **Do:** Minimise choices when response time is critical; Highlight a recommended option; Keep longer menus if the alternative is abstract labels
- **Don't:** Offer many equal-weight primary actions at one decision point; Use the 'magical number seven' to justify design limits; Simplify to the point of abstraction
- **Look at:** Count same-weight primary actions in a view; count options in a select or radio group with no recommended default. A menu's item count alone is not a failure.
- **Unless:** Recognition, not recall, governs menus — length is a scan cost, not a memory cost (Nielsen)

## 8. `usability.mindless-clicks-not-fewer-clicks`

Do not count clicks; make each one an unambiguous choice with clear link text that says where it goes.

- **Source:** Steve Krug, *Don't Make Me Think, Revisited — chapter 4 (Krug's Second Law of Usability)* — https://ptgmedia.pearsoncmg.com/images/9780321965516/samplepages/0321965515.pdf
- **In their words:** "It doesn't matter how many times I have to click, as long as each click is a mindless, unambiguous choice."
- **Do:** Write link text that identifies its target; Use breadcrumbs and hub pages for scent; Keep clear labelling with strong information scent
- **Don't:** Count clicks as the metric; Use generic links like 'Click here' or 'Learn more'
- **Look at:** Count links and buttons whose text is generic ('Click here', 'Learn more', 'Read more', bare 'Next') or duplicates another link's text with a different target; do not measure path length.
- **Unless:** Fewer clicks matter more when the same path is drilled repeatedly or pages take long to load (Krug)
- **Also stated as:** writing.links-describe-their-destination (Mailchimp).

## 9. `usability.no-false-affordances`

Nothing that is not interactive may look interactive: no underlined or blue static text, no button-shaped badges, no pointer cursor on inert elements.

- **Source:** Hoa Loranger, NN/g, *Beyond Blue Links: Making Clickable Elements Recognizable (2015)* — https://www.nngroup.com/articles/clickable-elements/
- **In their words:** "Avoid making non-clickable items (like headings) resemble buttons."
- **Do:** Reserve link colour and underline for links; Reserve button shape and fill for buttons
- **Don't:** Give static items hyperlink colours; Underline non-interactive text; Make headings or badges resemble buttons
- **Look at:** Elements with no href, handler, role or tabindex that have cursor: pointer, underline plus link colour, or a button-like box (border-radius, filled background, short centred text).
- **Also stated as:** modern.no-dead-zones-and-honest-clickability (Rauno Freiberg).

## 10. `usability.follow-conventions`

Work the way the sites and platforms users already know; a convention beats a locally optimised novelty.

- **Source:** Jakob Nielsen, *OK-Cancel or Cancel-OK? (2008)* — https://www.nngroup.com/articles/ok-cancel-or-cancel-ok/
- **In their words:** "Following platform conventions is more important than optimizing an individual dialog box."
- **Do:** Keep button order identical in every dialog; Highlight the most common button as default, except for dangerous actions; Prefer descriptive labels over 'OK'; Let users keep a familiar version for a while when changing
- **Don't:** Invent a new pattern for a solved problem; Vary the same control's placement between screens
- **Look at:** Logo in header links home; a search input has type=search or a search label; primary/secondary button order is the same in every dialog; cart and account icons stay where they were on other screens.
- **Unless:** Desktop apps follow their own OS: Windows OK-first, Apple OK-last
- **Also stated as:** craft.anything-but-dropdowns (Erik D. Kennedy); modern.boring-and-familiar-beats-novel (Scott Berkun).

## 11. `usability.visual-hierarchy-for-scanning`

Design for scanning, not reading: headings that out-rank body text, bold key phrases, lists, and no walls of unformatted text.

- **Source:** Kara Pernice, NN/g, *F-Shaped Pattern of Reading on the Web (2017, rev. 2026)* — https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/ (study)
- **In their words:** "The F-shaped scanning pattern is bad for users and businesses."
- **Do:** Use prominent headings with information-rich opening words; Bold key phrases; employ lists and bullets; Remove unnecessary content
- **Don't:** Leave walls of unstructured text; Let headings fail to out-rank body text visually; Let visual weight contradict importance
- **Look at:** Heading font-size and weight monotonic with level (h1 ≥ h2 ≥ h3 ≥ body); longest paragraph in words; ratio of headings and list items to total text blocks.
- **Unless:** The pattern needs moderate, not high, interest — highly motivated readers read
- **Also stated as:** craft.hierarchy-is-everything-squint-test (Erik D. Kennedy).

## 12. `usability.clearly-marked-emergency-exit`

Every interaction has a visible, labelled way out — Cancel, Back, Escape, Undo — so a mistaken action does not trap the user.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #3* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "Users often perform actions by mistake. They need a clearly marked 'emergency exit' to leave the unwanted action without having to go through an extended process."
- **Do:** Support Undo and Redo; Show a clear Cancel or close control; Label the exit clearly and make it discoverable
- **Don't:** Open a modal with no close; Build a wizard step with no back; Ship a destructive action with no undo
- **Look at:** For each role=dialog or modal: a focusable control whose text or aria-label matches close/cancel/back, and Escape dismisses it; for each step past the first in a flow: a back control exists.
- **Unless:** Legally required interstitials — the exit must still be visible, not necessarily free of consequence
- **Also stated as:** feedback.toast-actions-wait-for-the-user (Shopify Polaris).

## 13. `usability.aesthetic-usability-effect-bias`

Polish makes a screen look more usable than it is; discount your aesthetic impression and run the measurable checks first.

- **Source:** Kate Moran, NN/g, *The Aesthetic-Usability Effect (2024, rev. 2026)* — https://www.nngroup.com/articles/aesthetic-usability-effect/ (study)
- **In their words:** "Users' tendency to perceive attractive products as more usable. People tend to believe that things that look better will work better — even if they aren't actually more effective or efficient."
- **Do:** Rate your own screen after the measurable checks, not before; Treat polish as tolerance for minor problems only
- **Don't:** Read polish as usability; Let an attractive surface hide a usability problem
- **Look at:** Did the evaluator judge the screen usable because it looks good? Re-check the verdict against the count-kind entries before trusting it; 'attractive' is the variable and stays taste.
- **Unless:** With severe usability issues, or functionality sacrificed for aesthetics, users lose patience

## 14. `usability.natural-mapping-and-proximity`

Put a control next to the thing it changes and a label next to its field; gaps between groups must exceed gaps within them.

- **Source:** Marieke McCloskey, NN/g, *Form Design Quick Fix: Group Form Elements Effectively Using White Space (2013)* — https://www.nngroup.com/articles/form-design-white-space/
- **In their words:** "items near each other appear related"
- **Do:** Place labels as close to their fields as possible; Group related fields together; Place related targets close to each other; Put the call to action near the final form fields
- **Don't:** Put a control far from the thing it changes; Separate groups by less space than their members
- **Look at:** Distance from each label to its own input versus the nearest other input; gap within a fieldset versus gap between fieldsets; distance from last input to the submit button.
- **Unless:** Left-aligned labels are acceptable if space is constrained and labels are of similar length

## 15. `usability.start-with-user-needs-design-with-data`

Name the actor and their need before drawing a screen, then let measured behaviour, not hunches or looks, decide what changes.

- **Source:** GDS / GOV.UK, *Government Design Principles, principles 1, 3 and 4* — https://www.gov.uk/guidance/government-design-principles
- **In their words:** "Service design starts with identifying user needs. If you don't know what the user needs are, you won't build the right thing."
- **Do:** State the actor and need before the screen; Measure real behaviour; Start small and iterate
- **Don't:** Design to a hunch; Design to an aesthetic
- **Look at:** Does the journey name its actor and need (uxcli context show), and is the design decision traceable to observed behaviour rather than a hunch or a look?

## 16. `craft.fewer-borders`

Separate elements with space, a background shift, a shadow or striping before reaching for a border; too many borders make a design busy.

- **Source:** Adam Wathan & Steve Schoger, *Refactoring UI* — https://www.refactoringui.com/
- **In their words:** "Borders are a great way to distinguish two elements from one another, but using too many of them can make your design feel busy and cluttered."
- **Do:** Separate groups with space; Shift the background colour or add a shadow instead of a line; Zebra-stripe table rows instead of ruling them
- **Don't:** Use a 1px border as the default grouping device; Wrap a nav in a panel that only needs to recede; Rule every table row with a border when striping would do
- **Look at:** For every text node, count ancestors with a visible border, non-none box-shadow or outline; report max nesting depth and bordered boxes per viewport. Counted by `page.nesting`: `review check` refuses a `holds` it contradicts.
- **Unless:** Form inputs and the one object a person acts on keep their border; Keylines that make disconnected content feel connected; Decorative borders as style once the count is low
- **Also stated as:** canon.gestalt-common-region (Aurora Harley, NN/g); forms.group-related-inputs-in-a-fieldset (U.S. Web Design System (USWDS)); modern.fewer-borders-more-space (Adam Wathan & Steve Schoger); modern.cards-are-a-choice-not-a-default (Stan Kirilov); canon.tufte-one-plus-one-equals-three (Edward Tufte); craft.separation-order-space-then-lines-then-boxes (Adam Wathan & Steve Schoger; Erik D. Kennedy).

## 17. `craft.spacing-and-sizing-system`

Draw every margin, padding and gap from one scale, and make space between groups clearly larger than space within them.

- **Source:** Steve Schoger, *Little UI Details (tweet, 13 Jul 2017)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "Using multiples to define your spacing is a great way to achieve vertical rhythm and provides a formula to justify your choices"
- **Do:** Take spacing from a ladder of multiples of 4; Make between-group gaps larger than within-group gaps
- **Don't:** Use one-off values such as 13px or 27px; Use equal gaps across a group boundary
- **Look at:** Collect all computed margin, padding and gap values above 0; report distinct values and how many are off a 4px grid; compare label-to-field gap with field-to-next-label gap.
- **Unless:** Optical adjustments on icons and hanging punctuation sit a pixel or two off-scale
- **Also stated as:** canon.rams-thorough-to-the-last-detail (Dieter Rams); modern.radii-are-few-and-concentric (Vercel Labs); modern.spacing-comes-from-a-scale (Stan Kirilov).

## 18. `craft.wcag-contrast-and-dont-rely-on-colour-alone`

Meet 4.5:1 for body text and 3:1 for headlines, prefer soft backgrounds with dark text, and never convey status by colour alone.

- **Source:** Erik D. Kennedy, *100 Things a UX/UI Designer Should Know* — https://www.learnui.design/blog/100-things-ux-ui-designer-know.html
- **In their words:** "The WCAG recommended contrast ratio for body text — 4.5:1 to meet AA standards"
- **Do:** Style coloured badges as a soft background with dark text; Pair every colour state with an icon or label
- **Don't:** Set white text on yellow, green or red fills that fail 4.5:1; Convey status by colour only
- **Look at:** Standard contrast ratio of computed text colour against effective background at 4.5:1 or 3:1 by size; status elements must carry a non-colour signal such as text or an icon.
- **Unless:** Disabled controls; Logos; Incidental text, per WCAG itself
- **Also stated as:** modern.contrast-and-not-colour-alone (Apple); color.never-the-only-signal (W3C Accessibility Guidelines Working Group); navigation.you-are-here (U.S. Web Design System (USWDS)); feedback.message-type-said-in-words (U.S. Web Design System).

## 19. `craft.de-emphasize-to-emphasize-up-pop-down-pop`

To emphasize, quiet the competitors as much as you loudify the hero; never stack every up-pop property on non-title elements.

- **Source:** Erik D. Kennedy, *7 Rules for Creating Gorgeous UI, Part 2* — https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-2.html
- **In their words:** "If an element needs emphasis, apply BOTH up-pop and down-pop styles — but slightly MORE up-pop."
- **Do:** Set big numbers light and lower-contrast; Set small labels uppercase and bold; Make the competitor quieter rather than the hero louder
- **Don't:** Stack big, bold, bright and uppercase on any element that is not the page title
- **Look at:** Flag text at 2x body size or more that is also font-weight 700+, full contrast and uppercase, when it is not the page h1.
- **Unless:** The page title may be all-out up-pop
- **Also stated as:** canon.tufte-smallest-effective-difference (Edward Tufte).

## 20. `craft.black-and-white-first-limit-hues`

Design in greyscale first, then add one accent hue with purpose; vary by saturation and brightness, not by more hues.

- **Source:** Erik D. Kennedy, *7 Rules for Creating Gorgeous UI, Part 1* — https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-1.html
- **In their words:** "Design black and white first … Add color last, and even then, only with purpose."
- **Do:** Use greyscale plus one or two accent hues; Vary colour by saturation and brightness within a hue
- **Don't:** Use complementary or triadic colour-theory palettes as UI palettes; Give each section its own hue
- **Look at:** Cluster computed colours with saturation above 25% by hue within 15 degrees; count clusters, excluding declared semantic states such as error, success and warning.
- **Unless:** Sporty, flashy or cartoony brands that need a colour-fluent designer; Data-visualisation palettes
- **Also stated as:** color.few-families-in-proportion (U.S. Web Design System (GSA)).

## 21. `craft.greys-dont-have-to-be-grey-never-use-black`

Tint the neutral scale toward the brand hue and never use pure black for text.

- **Source:** Steve Schoger, *Little UI Details (tweet, 19 Mar 2018)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "'Grey' doesn't have to mean Grey™. Try saturating your greys with a bit of blue or brown for a cooler or warmer feel."
- **Do:** Tint the grey scale toward the brand hue; Raise saturation at the light and dark ends of the scale
- **Don't:** Use #000 for text; Use pure zero-saturation greys as the whole neutral palette
- **Look at:** Count text, border and background colours with saturation 0 and lightness under 15%, and the share of neutral swatches with saturation exactly 0.
- **Unless:** It does not always work; worth a trial; High-contrast or accessibility modes and print

## 22. `craft.start-with-too-much-whitespace`

Start with far more breathing room than feels necessary and remove it until it works; browser-default spacing is the largest mistake.

- **Source:** Erik D. Kennedy, *7 Rules for Creating Gorgeous UI, Part 1* — https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-1.html
- **In their words:** "To make UI that looks designed, add a lot of breathing room. … Sometimes a ridiculous amount."
- **Do:** Pad controls at least the text's own height; Space list and nav items twice the text height; Separate groups with much more space than sits within them
- **Don't:** Ship browser-default spacing with everything smashed toward the top
- **Look at:** Ratio of vertical padding to font-size on list items, nav items and buttons; ratio of gap between groups to gap within a group.
- **Unless:** Dense professional, interaction-heavy tools may compress, but spacing must stay consistent

## 23. `craft.type-scale-few-font-sizes`

Use about four font sizes from a fixed scale; reuse the default size for body, menus, lists and controls.

- **Source:** Erik D. Kennedy, *The Responsive Website Font Size Guidelines* — https://www.learnui.design/blog/mobile-desktop-website-font-size-guidelines.html
- **In their words:** "Even the most interaction-heavy pages can typically look just fine with about 4 font sizes total."
- **Do:** Use header, default, secondary (default minus 2px) and one wildcard size; Reuse the default size across body, menus, lists and controls
- **Don't:** Invent a new size per component; Apply a strict modular or golden-ratio scale to responsive pages
- **Look at:** Count distinct computed font-size values on visible text per viewport and how many fall outside the declared scale.
- **Unless:** Sizes must stay distinguishable, so large text may step many points apart; Marketing pages may add a display size

## 24. `canon.rams-as-little-design-as-possible`

Remove everything that does not serve the purpose; less, but better.

- **Source:** Dieter Rams, *Ten principles for good design* — https://www.vitsoe.com/us/about/good-design
- **In their words:** "Good design is as little design as possible. Less, but better – because it concentrates on the essential aspects, and the products are not burdened with non-essentials."
- **Do:** Remove anything that does not serve the purpose; Keep one border where one will do
- **Don't:** Add ornament or decoration for its own sake; Repeat the heading as a decorative icon; Wrap content in extra bordered or shadowed layers
- **Look at:** Decorative-only elements (no text, image or interactive role, only border/shadow/background) and distinct box-shadow, border-radius and gradient declarations in computed styles.
- **Unless:** Aesthetic quality is part of usefulness (principle 3): stripping to nothing is not the goal

## 25. `canon.bringhurst-leading-is-a-rhythmic-unit`

The leading is the vertical unit; add and remove vertical space in multiples of it.

- **Source:** Robert Bringhurst, *The Elements of Typographic Style §2.2.1 / §2.2.2 (via webtypography.net)* — http://webtypography.net/2.2.1
- **In their words:** "You must choose not only the overall measure – the depth of the column or page – but also a basic rhythmical unit. This unit is the leading, which is the distance from one baseline to the next."
- **Do:** Use a unitless line-height such as 1.5; Make vertical margins multiples of the line-height
- **Don't:** Vertical spacing unrelated to the line unit; Line-height below 1 on running text
- **Look at:** Body line-height L; margins and paddings between text blocks as multiples of L (or L/2 if the lens allows).
- **Unless:** More leading for longer measures, darker faces, larger x-height and sans serifs: the ratio moves with the face

## 26. `canon.vignelli-grid-module-fits-the-job`

Lay everything on one grid whose module is coarse enough to constrain and fine enough to serve the content.

- **Source:** Massimo Vignelli, *The Vignelli Canon, Grids, Margins, Columns and Modules (p.40)* — https://www.rit.edu/vignellicenter/sites/rit.edu.vignellicenter/files/documents/The%20Vignelli%20Canon.pdf
- **In their words:** "There are infinite kinds of grids, but just one - the most appropriate - for any problem"
- **Do:** Resolve block edges to a few column positions; Choose one column model per page
- **Don't:** Place blocks at arbitrary x positions; Use a grid so fine it constrains nothing
- **Look at:** Distinct left-edge x positions of top-level blocks and their fit to the best k-column model (residual within 2px).
- **Unless:** Outside margins may be made deliberately small to give tension between page edge and content

## 27. `canon.bringhurst-letterspace-caps-5-10`

Letterspace all-caps and small-caps runs by 5–10% of the type size; do not letterspace lowercase.

- **Source:** Robert Bringhurst, *The Elements of Typographic Style §2.1.6 / §2.1.7 (via webtypography.net)* — http://webtypography.net/2.1.6
- **In their words:** "The normal value for letterspacing these sequences of small or full caps is 5% to 10% of the type size."
- **Do:** Set letter-spacing 0.05–0.1em on caps labels, eyebrows and buttons
- **Don't:** All-caps at zero tracking; Tracked lowercase body text
- **Look at:** For text with text-transform uppercase or all-caps content of ≥3 letters: computed letter-spacing divided by font-size; same ratio on lowercase paragraphs.
- **Unless:** Display type at large sizes may be tracked tighter (not stated on the fetched page)

## 28. `modern.every-state-is-designed`

Empty, sparse, dense, error and loading states are designed; skeletons match final layout and long content never overflows.

- **Source:** Vercel Labs, *Web Interface Guidelines — AGENTS.md* — https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/AGENTS.md
- **In their words:** "MUST: Design empty/sparse/dense/error states"
- **Do:** An empty state with a primary create action; Skeletons sized like real rows; min-w-0 and truncation on flex children
- **Don't:** Blank screens on empty arrays; Spinners that reflow content; Overflow from long strings
- **Look at:** Render with [], with 1 item, with 500 items and with a 300-character title; assert no horizontal overflow, no overlap, an actionable control in the empty state, and skeleton-to-loaded CLS under a threshold.
- **Also stated as:** writing.empty-states-say-what-next (GitHub Primer); data-display.empty-data-explains-and-offers-next-step (IBM Carbon Design System); data-display.wrap-before-truncating-and-reveal-the-rest (GitHub Primer).

## 29. `modern.no-junk-drawer-menus-or-unlabeled-icons`

Icons carry labels, menus are named for what they hold, and no primary feature hides under More or an ellipsis.

- **Source:** Jakob Nielsen (NN/G), *Top 10 Application-Design Mistakes* — https://www.nngroup.com/articles/top-10-application-design-mistakes/
- **In their words:** "most icons, unless they have a text label next to them, will be difficult or impossible for users to understand"
- **Do:** Labelled icons; Menus named for their contents; Inline help before tooltips
- **Don't:** More, ellipsis or Tools catch-alls holding primary features; Icon-only toolbars without labels; Tooltips on disabled buttons
- **Look at:** Icon-only buttons with no text and no aria-label fail; menus triggered by More, …, Tools or Options holding over 5 items or a primary-action label warn; disabled buttons with title or aria-describedby fail.
- **Unless:** Universally recognised icons in tight toolbars, though even the hamburger is weaker than designers think
- **Also stated as:** writing.buttons-name-the-action (IBM Carbon Design System); navigation.primary-nav-visible-on-wide-screens (GitHub Primer); usability.dont-make-me-think (Steve Krug).

## 30. `modern.frequent-actions-do-not-animate`

Actions used many times a day, and anything keyboard-triggered, appear instantly without an enter animation.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "Actions that are frequent and low in novelty should avoid extraneous animations: opening a right click menu, deleting or adding items from a list, hovering trivial buttons"
- **Do:** Show context menus, command palettes and list changes instantly; Leave keyboard-driven navigation unanimated
- **Don't:** Opacity and scale fades on controls used hundreds of times a day; Animating keyboard-initiated actions
- **Look at:** Enter animations on [role=menu], [cmdk-root] and newly inserted list items (animation-name not none), and animation state diffed within 16ms of a dispatched key; which actions count as frequent comes from the journey.
- **Unless:** macOS context menus fade out and blink the chosen item; Rare features may be theatrical (delight-impact curve)
- **Also stated as:** modern.motion-values-proportional-to-trigger (Rauno Freiberg); feedback.motion-duration-scales-with-size (IBM Carbon Design System).

## 31. `modern.honour-prefers-reduced-motion`

Every large motion has a reduced variant under prefers-reduced-motion; fade instead of slide rather than ignoring the setting.

- **Source:** Emil Kowalski, *Great Animations* — https://emilkowal.ski/ui/great-animations
- **In their words:** "our animations need to account for people who don't want animations"
- **Do:** Provide a reduced variant such as a fade instead of a slide; Give autoplaying motion over five seconds pause, stop or hide controls
- **Don't:** Large translate or scale motion that ignores the media query
- **Look at:** Emulate prefers-reduced-motion: reduce and list elements whose computed animation-name or transition-property still includes translations over about 20px or durations above zero.
- **Unless:** Motion that is the content, such as a video or a chart drawing, is out of scope
- **Also stated as:** feedback.moving-content-can-be-paused (W3C Accessibility Guidelines Working Group).

## 32. `modern.signifiers-survive-flatness`

Flat styling keeps its signifiers: buttons have a fill or border, links are underlined or distinctly coloured, inputs show a boundary.

- **Source:** Kate Moran (NN/G), *Flat UI Elements Attract Less Attention and Cause Uncertainty* — https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/ (study)
- **In their words:** "participants spent 22% more time… looking at the pages with weak signifiers"
- **Do:** Buttons with a discernible fill or border; Links underlined or in a distinct colour; Inputs with a visible boundary
- **Don't:** Text-only buttons indistinguishable from labels; Links styled as body text; Long shadows and other purely aesthetic depth
- **Look at:** For each button or role=button: background differs from parent, or border width above 0, or text colour is the accent, else fail; an in-text link with no text-decoration and colour close to the surrounding text fails.
- **Unless:** Toolbar icon buttons with tooltips and hover fills; Navigation bars recognised by position

## 33. `modern.mobile-inputs-do-not-zoom-or-trap`

Inputs are at least 16px on phones, never autofocus on touch, and the page never disables zoom or blocks paste.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "Font size for inputs should not be smaller than 16px to prevent iOS zooming on focus"
- **Do:** Set type, inputmode and autocomplete on every input; Use touch-action: manipulation on controls
- **Don't:** Viewport meta with user-scalable=no; Paste handlers that preventDefault; autofocus at phone widths
- **Look at:** Computed font-size of input, select and textarea at a 390px viewport under 16px; viewport meta containing user-scalable=no; paste handlers that preventDefault; [autofocus] present at phone width.
- **Unless:** Desktop-only admin tools; Autofocus on desktop with a single primary input
- **Also stated as:** forms.input-type-matches-the-answer (GOV.UK Design System).

## 34. `modern.numbers-and-text-do-not-shift-layout`

Numbers in columns and timers use tabular figures, images carry dimensions, and nothing changes weight on hover.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "tabular figures should be applied with `font-variant-numeric: tabular-nums`, particularly in tables or when layout shifts are undesirable, like in timers"
- **Do:** tabular-nums in tables, timers and prices; width and height on every img
- **Don't:** Proportional digits in columns; Images without dimensions; Weight changes on hover
- **Look at:** Numeric td cells whose computed font-variant-numeric lacks tabular-nums; img without width/height or aspect-ratio; sibling rect drift while a counter fixture runs.
- **Unless:** Prose numbers
- **Also stated as:** data-display.right-align-numbers-tabular-figures (GitHub Primer).

## 35. `modern.delight-scales-with-rarity`

Spend delight on rare moments, keep daily actions plain, and never let an element visibly duplicate itself during a transition.

- **Source:** Benji Taylor, *Family Values* — https://benji.org/family-values
- **In their words:** "the potential for delight increases as the frequency of feature usage decreases"
- **Do:** Directional motion between tabs; Morphing labels such as Continue to Confirm; One action per tray
- **Don't:** Static jumps on core flows; Theatrical motion on daily actions; An element visibly duplicated mid-transition
- **Look at:** After a transition, count DOM nodes with the same key or text present twice on screen at once; frequency-weighted motion needs the journey to say what is frequent.
- **Unless:** Utility, performance and security come first; delight is selective emphasis

## 36. `modern.animate-only-transform-and-opacity`

Animate only transform and opacity, listing properties explicitly; never transition all or animate layout properties.

- **Source:** Emil Kowalski, *Great Animations* — https://emilkowal.ski/ui/great-animations
- **In their words:** "you should try to animate with `transform` and `opacity` as they only trigger the third rendering step (composite)"
- **Do:** Prefer CSS, then WAAPI, then JS for motion; Use clip-path for reveals; List transitioned properties explicitly
- **Don't:** transition: all; Animating width, height, top, left, margin or padding; Large blur() values on filter or backdrop-filter in motion
- **Look at:** Scan stylesheets and computed transition-property for all and for layout properties; scan @keyframes for width, height, top and left.
- **Unless:** Accordion height animation via grid-template-rows or interpolate-size is layout by nature and accepted when it is the only honest way

## 37. `modern.motion-has-an-origin`

A popover or menu animates from the side facing its trigger; set transform-origin where the motion physically starts.

- **Source:** Emil Kowalski, *Good vs Great Animations* — https://emilkowal.ski/ui/good-vs-great-animations
- **In their words:** "When we click on a button that opens a dropdown, we expect the dropdown to animate from where the button is"
- **Do:** Set transform-origin toward the trigger; Use the anchoring library's origin variable when one exists
- **Don't:** Popovers scaling from their own centre when anchored to a button
- **Look at:** For each open popover or menu with a known trigger (aria-controls or aria-haspopup), compare the computed transform-origin with the side facing the trigger.
- **Unless:** Centred modals have no anchor; a centred origin is right there

## 38. `modern.animations-are-interruptible`

An open or close animation can be reversed mid-flight by the next input; nothing waits for a transition to finish.

- **Source:** Emil Kowalski, *Great Animations* — https://emilkowal.ski/ui/great-animations
- **In their words:** "Great animations are interruptible"
- **Do:** Use CSS transitions that reverse mid-flight, or spring libraries
- **Don't:** pointer-events: none locks while an animation plays; Keyframe-driven open and close that must finish before the next input
- **Look at:** Open a panel, immediately send the close input, sample the element's bounding box about 50ms later; if it is still growing the animation was not interruptible. Depends on timing tolerance.
- **Unless:** Destructive commits that fire only on gesture end are about triggering, not interruptibility

## 39. `modern.readable-type-sizes-and-weights`

Body text sits at the platform default size, weights stay 400 or heavier, and weight never changes on hover.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "Font weights below 400 should not be used"
- **Do:** 17px body on touch, 13px minimum on desktop UI; Weights between 400 and 700; Headings at weight 500–600; Minimise the number of typefaces
- **Don't:** Body text under 11pt; font-weight 300 or lower; Weight swaps on hover or selected state
- **Look at:** Computed font-size and font-weight of every text node at a phone viewport; count distinct font-family stacks and warn above 2.
- **Unless:** Captions and legal text may sit at the platform minimum; Display headings may use light weights at large sizes

## 40. `modern.focus-is-visible-and-unobscured`

Every focusable element shows a visible focus ring on :focus-visible, and no sticky or fixed element ever covers it.

- **Source:** Vercel Labs, *Web Interface Guidelines — AGENTS.md* — https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/AGENTS.md
- **In their words:** "NEVER: `outline: none` without visible focus replacement"
- **Do:** Style :focus-visible with box-shadow or outline plus outline-offset
- **Don't:** outline: none or 0 with no replacement; Focus rings hidden under sticky headers
- **Look at:** Tab through every focusable element; diff the focused and unfocused rect or read computed outline and box-shadow under :focus-visible; check the focused rect is not intersected by position fixed or sticky elements above it.

## 41. `modern.shadows-share-one-light-source`

All shadows on a page share one light direction and offset ratio, layered and tinted toward the background hue.

- **Source:** Josh W. Comeau, *Designing Beautiful Shadows in CSS* — https://www.joshwcomeau.com/css/designing-shadows/
- **In their words:** "every shadow on the page should share the same ratio"
- **Do:** A tokenised elevation scale; Two to five layered shadows; Shadow colour matched to the background hue
- **Don't:** Fuzzy grey boxes; Shadows with inconsistent x:y ratios across the page; Pure-black high-alpha shadows; Blurry borders used as separators
- **Look at:** Collect every computed box-shadow; fail when offset signs mix across the page or distinct shadow strings exceed about 6; warn when shadow hue is far from the background hue with alpha above 0.5.
- **Unless:** Inset shadows for sunken fields; Glows meant as glows

## 42. `modern.defaults-are-decisions-you-inherited`

A library or AI default is someone else's decision; commit to one written aesthetic direction instead of inheriting it.

- **Source:** hipuku, *The Default Is Not a Design Decision* — https://www.hipuku.dev/writing/the-default-is-not-a-design-decision
- **In their words:** "The default was always a design decision. Someone made it upstream, and everyone who builds on top inherits it without asking why."
- **Do:** A written token set such as DESIGN.md; One committed aesthetic direction; Semantic colour
- **Don't:** Untouched library defaults; Clean and modern as a brief; The AI-look constellation of purple gradient, Inter, identical cards, glass glow and bounce hover
- **Look at:** Score the constellation: purple-to-blue/cyan gradients warn, Inter or Roboto with no display face notes, 3+ identical icon+h3+p cards note, backdrop-filter plus glow notes, gradient text on numerals warns, overshoot cubic-bezier on hover warns.
- **Unless:** A purple brand is allowed to be purple; the tell is the constellation and the absence of a decision, not any one colour

## 43. `color.status-colours-keep-their-meaning`

Each status colour has one meaning across the product (critical for errors and blocked actions, warning for what needs attention, success for what went well, info for tips) and is never borrowed for promotion or decoration.

- **Source:** Shopify Polaris, *Colors: Palettes and roles (Critical, Success)* — https://polaris.shopify.com/design/colors/palettes-and-roles
- **In their words:** "Elements using critical must convey messaging that implies that an action is impossible, blocked, or has resulted in an error."
- **Do:** Map error, warning, success and info to named roles or tokens and use them only in those roles; Reserve the critical red for errors, blocked actions and destructive buttons; Use the info role, not warning or critical, for tips and announcements
- **Don't:** A sale or 'new' badge in the error red; Success green used to entice or to advertise an offer; Warning colour for 'coming soon' or 'under construction' messaging; Two different reds meaning error on different screens
- **Look at:** Find the colour the page uses for error text (an element with role=alert, aria-invalid's described-by message, or a class/token named error/critical/danger) and the success colour likewise. Count painted elements (text, fill or border) whose colour equals that error or success colour, within a ΔE of 3, and that are neither a validation message, an invalid field, a status badge of that meaning, nor a destructive action.
- **Unless:** Brand colours that happen to be red, as long as a separate, distinct error red is used for errors; Data visualisations where a series colour coincides with a status hue but no status is implied (prefer avoiding it)

## 44. `color.from-tokens-not-hex`

Every colour on the page comes from the design system's named tokens or palette functions, never from hex values copied into components.

- **Source:** GOV.UK Design System (Government Digital Service), *Styles: Colour* — https://design-system.service.gov.uk/styles/colour/
- **In their words:** "Do not copy the specific hexadecimal (hex) colour values."
- **Do:** Reference colour by role token (brand, text, error, border) rather than by value; Use palette colours (tints and shades of a few families) for supporting elements; Use a functional token only in the context it is designed for
- **Don't:** Hex literals in component styles; Near-duplicate colours (#1d70b8 next to #1d70b9) created by eye-dropping; Using the error token as a general red
- **Look at:** Collect every computed color, background-color, border-*-color, outline-color and fill/stroke of painted elements, and every value of CSS custom properties declared on :root (and on any theme selector). Count distinct painted colours that match no custom-property value (exact RGBA after resolution), and count pairs of painted colours closer than ΔE 2 that are not identical.
- **Unless:** Images, illustrations and embedded third-party widgets; Browser defaults on unstyled native controls; GOV.UK: palette colours (not functional ones) are allowed for illustrations and custom components

## 45. `color.controls-and-graphics-3-to-1`

The parts that show a control is there and what state it is in (input borders, checkbox boxes and ticks, toggle tracks, icon-only buttons, meaningful chart marks) contrast at least 3:1 with the colours next to them.

- **Source:** W3C Accessibility Guidelines Working Group, *Understanding Success Criterion 1.4.11: Non-text Contrast (WCAG 2.2)* — https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- **In their words:** "Unless the control is inactive, any visual information provided that is necessary for a user to identify that a control is present and how to operate it must have a minimum 3:1 contrast ratio with the adjacent colors."
- **Do:** Input borders at 3:1 against the background the input sits on, or a filled input background at 3:1; Checkbox ticks and radio dots at 3:1 against the box; Standalone icons at 3:1 against their background; Avoid very thin lines that anti-alias below the nominal ratio
- **Don't:** Pale grey input borders (#ddd on white is about 1.4:1); A selected state shown only by a faint tint; Hover effects that lower a control's contrast with its surroundings
- **Look at:** For each visible input, select, textarea, checkbox, radio, [role=switch] and icon-only button (no visible text): compute the contrast ratio between the colour that identifies it (border colour, or its own background when it has no border, or the icon fill) and the background behind it; count those below 3:1, unrounded. Disabled controls are skipped.
- **Unless:** Inactive (disabled) controls are exempt; A control identified by its visible text needs no contrasting boundary; Logos and decorative graphics; Appearance determined by the browser and not modified by the author

## 46. `color.focus-ring-contrasts-with-its-surroundings`

The focus indicator contrasts at least 3:1 with whatever it is drawn against: the page background for an outer ring, the component's own colours for an inner one.

- **Source:** W3C Accessibility Guidelines Working Group, *Understanding Success Criterion 1.4.11: Non-text Contrast, Relationship with Focus Visible (WCAG 2.2)* — https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- **In their words:** "In combination with 2.4.7 Focus Visible, the visual focus indicator for a component must have sufficient contrast against the adjacent background when the component is focused, except where the appearance of the component is determined by the user agent and not modified by the author."
- **Do:** An outer ring that contrasts with the page background; A two-colour ring (dark and light) that holds on any background; A thick indicator rather than a 1px one
- **Don't:** A yellow outer ring on a white page; A focus border that changes hue inside the component without contrasting with its fill; Focus shown only by a background tint change
- **Look at:** Tab to each focusable control; diff the focused and unfocused screenshots of the control's box padded by a few pixels; for the changed pixels, take their colour and the colour of the unchanged pixels adjacent to them (page background outside, component fill inside). Count controls where no changed region reaches 3:1 against its adjacent colour. page.focus-visible checks only that some pixel changes; this checks that the change can be seen.
- **Unless:** Unmodified browser default focus styles; WCAG does not compare focused and unfocused states with each other; a background-only change is out of scope for 1.4.11 but fails Use of Color

## 47. `writing.one-label-per-action`

One concept, one word: controls that do the same thing carry the same label everywhere, and controls that do different things never share a label.

- **Source:** GitHub Primer, *Accessibility guide: Descriptive buttons, 'How to test names'* — https://primer.style/guides/accessibility/descriptive-buttons
- **In their words:** "When buttons perform the same action, they have the same name."
- **Do:** Keep a terminology list of preferred words and words not to use for the product; Pick one verb per action (Delete or Remove, not both for the same thing) and reuse it across pages; Add the object to disambiguate repeated actions ('Remove Apples', 'Remove Pears')
- **Don't:** Synonyms for one action across screens: 'Save' here, 'Update' there, 'Apply' elsewhere; Identical labels for different actions on the same page; Naming the same object two ways ('workspace' and 'project') in one product
- **Look at:** Across the journey's pages, collect (accessible name, action) pairs for buttons and links, where action is the form action/href/handler target. Count names that map to two or more different actions on one page, and actions reached by two or more different names across pages; also flag known synonym pairs present together (save/update/apply, delete/remove, sign in/log in, cart/basket). Count must be 0.
- **Unless:** Delete and Remove may coexist when they mean different things (destroy vs take out of a collection), as Carbon defines them — then each must be used only for its own meaning
- **Also stated as:** navigation.same-navigation-on-every-page (W3C WAI).

## 48. `writing.sentence-case-ui-text`

Labels, buttons, headings, tabs and table headers are written in sentence case; capitals only for the first word, proper nouns and acronyms — never title case or all caps for emphasis.

- **Source:** IBM Carbon Design System, *Content guidelines: Writing style, Capitalization* — https://carbondesignsystem.com/guidelines/content/writing-style/
- **In their words:** "Use sentence–case capitalization for all UI text elements."
- **Do:** 'First name', 'Email address', 'Save changes'; Refer to a UI element with the capitalization it has in the UI ('the My network page'); Use bold or italic, not capitals, for emphasis
- **Don't:** Title Case Buttons Like 'Save Your Changes'; ALL CAPS text set in the markup (as opposed to a tracked small label styled with text-transform); Capitalizing feature names to mark them as special
- **Look at:** For each button, label, th, tab and h1–h6 with three or more words, take the rendered text (after text-transform) and count those where two or more non-initial words that are not acronyms or in the page's proper-noun list start with a capital (title case), or where the whole text of four or more words is upper case. Count must be 0.
- **Unless:** Proper nouns, product names and acronyms keep their capitals; Mailchimp's own guide uses title case for page titles, menu names and global navigation — a house style, decide one and keep it; Short tracked overline labels in caps are a typographic choice; the four-word floor leaves them alone

## 49. `writing.dates-numbers-units-for-the-reader`

Dates spell out the month, numbers are numerals with thousands separators, and units sit a space after their number — formatted in the reader's locale, never as an ambiguous all-numeric date or a raw machine value.

- **Source:** Shopify Polaris, *Content: Grammar and mechanics, 'Numbers, dates, and currency'* — https://polaris.shopify.com/content/grammar-and-mechanics
- **In their words:** "Use the month’s full name. If there isn’t enough space, use 3-letter abbreviations. Don’t write dates with numerals only."
- **Do:** 'December 11, 2024' or 'Dec 11, 2024' (in the reader's locale order); Numerals, not words: 'You have 5 orders to fulfill'; Thousands separators: '12,000'; A space between number and unit: '3.4 lb', '2 kg'; Currency code after the amount when currencies can be confused: '$10,000 USD'; Format with Intl.DateTimeFormat / Intl.NumberFormat for the user's locale
- **Don't:** All-numeric dates like '12/11/24'; ISO timestamps or epoch values shown raw ('2024-12-11T09:30:00Z'); Ordinals in dates ('January 23rd'); Unit glued to the number ('3.4lb'); Shortened numbers like '12 k' where the exact value matters
- **Look at:** Scan visible text nodes. Count matches of all-numeric dates (\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b), raw ISO timestamps (\d{4}-\d{2}-\d{2}T\d{2}:), integers of 5+ digits with no separator outside codes/IDs, and numbers glued to a unit (\d(kg|lb|cm|mm|km|mi|ml|oz)\b). Count must be 0.
- **Unless:** Polaris notes these are American English base rules and dates, numbers and measurements should be localized automatically — the target is the reader's locale, not US format; Identifiers, codes, SKUs and years are not quantities and take no separator; Dense data tables may use compact numeric dates if the format is unambiguous for the locale and stated in the column header

## 50. `data-display.no-tables-for-layout`

A table is for comparing data in rows and columns, never for arranging content on the page; layout belongs to the grid.

- **Source:** GOV.UK Design System (Government Digital Service), *Table — When not to use this component* — https://design-system.service.gov.uk/components/table/
- **In their words:** "Never use the table component to layout content on a page."
- **Do:** CSS grid or flex for page and dashboard layout; A list, cards or a summary list for items that do not share columns; Tables only where every row has the same fields
- **Don't:** A table that positions a sidebar, form or dashboard tiles; Table cells holding headings, paragraphs or whole forms; role=presentation on a table that actually holds tabular data
- **Look at:** Count table elements that have no th and either contain headings, more than one paragraph per cell, form fieldsets or nested tables, or have a single row whose cells hold unrelated content blocks.
- **Unless:** HTML email, where tables are still the only reliable layout tool

## 51. `data-display.text-left-headers-follow-their-column`

Text cells are left-aligned, nothing in a data table is centred, and each column header takes the same alignment as the data below it.

- **Source:** W3C WAI (Eric Eggert, Shadi Abou-Zahra, eds.), *Tables Tutorial — Tips and Tricks: Alignment* — https://www.w3.org/WAI/tutorials/tables/tips/
- **In their words:** "Align text to the left and numeric data to the right (in left-to-right languages), so that people using larger text sizes or smaller screens will be able to find it. … It’s helpful to give column headers the same alignment as the data in the cells below."
- **Do:** Left-align (start-align) textual cells and their headers; Give each th the same horizontal alignment as the cells of its column; Mirror alignment in right-to-left languages
- **Don't:** Centre-aligned text or number columns; A left-aligned header above a right-aligned numeric column; Centred headers as a table-wide default
- **Look at:** For each table column: count th whose computed text-align differs from the dominant text-align of the td in the same column, and count td/th whose computed text-align is center (excluding cells that hold only a checkbox, icon or status badge).
- **Unless:** A column holding only a checkbox, icon or single glyph may be centred; Right-to-left scripts reverse the sides

## 52. `data-display.one-unit-and-format-per-column`

Every value in a column uses the same unit, precision and format; the unit is named once in the header, not repeated in each cell.

- **Source:** U.S. Web Design System (GSA), *Table — Usability guidance* — https://designsystem.digital.gov/components/table/
- **In their words:** "Predictably format columns. Take care not to vary units or formatting within the same column. Instead, normalize values so they can be easily compared."
- **Do:** Normalise a column to one unit (all days, not days and weeks); Keep the same number of decimal places in every row of a column; Put the unit or symbol in the column header ('Temperature °C') rather than in every cell; Use one date format and one thousands separator throughout the table
- **Don't:** Mixing '3 days' and '2 weeks' in one column; '12.5', '12.50' and '12.500' in the same column; Abbreviating some values ('1.2k') and not others in the same column
- **Look at:** For each column of numeric td, count distinct decimal-place counts, distinct unit suffixes or prefixes, and distinct date formats; any column with more than one is a failure.
- **Unless:** A column deliberately mixing magnitudes where the unit changes are labelled per cell and sorting is by underlying value — rare, and worth questioning

## 53. `data-display.summary-list-for-key-value-facts`

A set of facts about one thing — label and value pairs — is shown as a summary list (dl with dt and dd), not as a table with no headers or as loose text.

- **Source:** GOV.UK Design System (Government Digital Service), *Summary list — When to use / When not to use this component* — https://design-system.service.gov.uk/components/summary-list/
- **In their words:** "Use a summary list to show information as a list of key facts. … only use it to present information that has a key and at least one value."
- **Do:** dl with dt (the key) and dd (the value) for record details, metadata and check-your-answers pages; A row action ('Change') whose accessible name includes the key ('Change name'); Headings or cards to separate several summary lists on one page
- **Don't:** A two-column table without th used to show one record's fields; Key–value pairs set as 'Label: value' runs in a paragraph; A summary list for genuinely tabular data or a plain list of items
- **Look at:** Where the screen shows the fields of a single record (a profile, an order, an item's metadata, a check-answers page), are the label–value pairs marked up as dl/dt/dd with each key visually distinct from its value — and is tabular data comparing several records in a table rather than a summary list?
- **Unless:** Two or three facts inside a card may be inline text if they are not scanned as a set

## 54. `forms.error-summary-at-the-top`

After a failed submit, show an error summary at the top of the page that takes focus and links each error to its field — even when there is only one error.

- **Source:** GOV.UK Design System, *Error summary component* — https://design-system.service.gov.uk/components/error-summary/
- **In their words:** "Always show an error summary when there is a validation error, even if there’s only one."
- **Do:** A summary above the h1 (below any back link) with a heading such as 'There is a problem'; Move keyboard focus to the summary when it appears; One link per error, pointing at the field (or the first field of a date or radio group); Word each summary item exactly like the message beside its field; Prefix the page <title> with 'Error: '
- **Don't:** Errors shown only beside fields far down a long form, with focus left on the submit button; A summary of plain text with no links to the fields; A toast or banner that disappears before it can be read
- **Look at:** Submit the form empty. Within 1 s: is there an element above the first h1 of main that has focus (document.activeElement inside it), contains one link per invalid field, and does each link's href resolve to the id of an invalid input? Does document.title start with 'Error'?
- **Unless:** Primer suggests the interactive summary only for 3 or more errors, and otherwise focusing the first invalid field; A one-field form (search, single email sign-up) can rely on the message beside the field

## 55. `forms.validate-when-the-user-is-done`

Do not show an error while the user is still typing; validate when they try to continue, and only add earlier validation where research shows it helps.

- **Source:** GOV.UK Design System, *Recover from validation errors pattern — When to tell the user about validation errors* — https://design-system.service.gov.uk/patterns/validation/
- **In their words:** "Generally speaking, avoid validating the information in a field before the user has finished entering it. This sort of validation can cause problems - especially for users who type more slowly."
- **Do:** Validate on Continue or Submit; After a failed submit, update a field's error live once the user fixes it (Primer); A character count is the accepted exception: warn as the limit is passed
- **Don't:** An error that appears on the first keystroke of an email or phone field; Red borders on an untouched form at load; Browser-native HTML5 validation bubbles in place of designed messages
- **Look at:** Focus an email or formatted field and type one character, keeping focus. Wait 1 s. Does any error message, aria-invalid=true or error colour appear before blur or submit? Also load the form fresh: are any fields already marked invalid?
- **Unless:** GOV.UK goes further and says not to validate on blur either; Baymard (usability.inline-validation-after-leaving-field) recommends blur validation for hard fields — the schools agree only on 'not while typing'; Primer allows validating as the user types once the field has already been flagged invalid, so the error clears as soon as it is fixed

## 56. `forms.keep-answers-after-an-error`

When a submit fails, show the form again with every answer the user gave still in it — the failing ones and the passing ones.

- **Source:** GOV.UK Design System, *Error message component — How it works* — https://design-system.service.gov.uk/components/error-message/
- **In their words:** "Do not clear any form fields when showing the Error message component. Keep both passing and failing answers."
- **Do:** Re-render server-side errors with submitted values filled in; Keep the failing value so the user can see and edit what went wrong; Pre-populate fields when the user goes back to change an answer
- **Don't:** A reload that empties the form after a server error; Clearing the field that failed; Clearing password-adjacent fields such as name and email along with the password
- **Look at:** Fill every field with valid values except one, submit, and after the error page paints read each input's value: how many fields that had a value now read empty?
- **Unless:** Password and card security code fields may be cleared for security, and the message should say so

## 57. `forms.mark-optional-fields-in-words`

Ask mostly required questions and label the exceptions '(optional)' in words; do not mark required fields with asterisks.

- **Source:** GOV.UK Design System, *Question pages pattern* — https://design-system.service.gov.uk/patterns/question-pages/
- **In their words:** "in most contexts, add ‘(optional)’ to the labels of optional fields"
- **Do:** '(optional)' in the label, or in the legend for a radio or checkbox group; Removing optional questions before marking them; One convention across the whole service
- **Don't:** Asterisks on mandatory fields; Optional fields that look identical to required ones; Required and optional marked differently on different pages
- **Look at:** Submit the form with every field empty and note which fields raise no error (optional). Count optional fields whose label or legend text lacks 'optional', and labels that contain '*'.
- **Unless:** USWDS instead marks required fields with a red asterisk explained by a note at the top, and also labels optional fields '(optional)' — the schools agree that optional fields say so in words; Primer and USWDS exempt one-field forms and login forms, where every field is plainly required

## 58. `forms.autocomplete-names-the-purpose`

Every field that asks about the user — name, email, phone, address, postcode, birthday, card — carries the matching autocomplete token so browsers and assistive tech can fill and label it.

- **Source:** W3C Web Accessibility Initiative, *Understanding WCAG 2.2 Success Criterion 1.3.5: Identify Input Purpose* — https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html
- **In their words:** "Use code to indicate the purpose of common inputs, where technology allows."
- **Do:** autocomplete='name' or 'given-name' and 'family-name' on name fields; 'email', 'tel', 'postal-code', 'street-address' or 'address-line1', 'bday-day'/'bday-month'/'bday-year'; 'shipping' and 'billing' section tokens on order forms; autocomplete='off' on the form, if needed, while each field still declares its purpose
- **Don't:** autocomplete='off' on personal fields with no purpose token; Personal-data fields with no autocomplete attribute; A token that does not match the field (email token on a phone field)
- **Look at:** For every input, select and textarea whose label matches name, email, phone, address, postcode/ZIP, city, country, date of birth, card number or expiry: count those whose autocomplete attribute is missing, 'off', or not a WCAG input-purpose token that matches the label.
- **Unless:** Fields about someone other than the user (a recipient's email) are outside 1.3.5; A field that accepts either username or email may carry one token or none

## 59. `forms.hint-text-is-short-and-linked`

Hint text sits between the label and the input, is one short sentence with no links, and is tied to the input with aria-describedby; longer explanation goes in the page body.

- **Source:** GOV.UK Design System, *Text input component — Hint text* — https://design-system.service.gov.uk/components/text-input/
- **In their words:** "Keep hint text to a single short sentence, without any full stops."
- **Do:** Hint placed after the label and before the input; The input's aria-describedby lists the hint's id (and the error's, when shown); Hints that say where to find the answer or how it will be used; A statement heading plus body text when a question needs a long explanation
- **Don't:** Links inside hint text; Multi-sentence paragraphs as hints; Hints placed below the input where they are read after typing; Hints in a tooltip behind an icon
- **Look at:** For every element used as a hint (referenced by an input's aria-describedby, or styled as hint between label and input): count hints containing an <a>, hints longer than one sentence or about 120 characters, hints rendered below their input, and visible hints not referenced by their input's aria-describedby.
- **Unless:** A format example ('For example, QQ 12 34 56 C') may follow the sentence; "About 120 characters" in "look at" is uxcli's reading of "a single short sentence", not a number the source gives.

## 60. `forms.ask-only-what-you-need`

Every question on the form has a named use; drop the ones nobody can justify, and never ask for the same thing twice in one journey.

- **Source:** GOV.UK Design System, *Question pages pattern* — https://design-system.service.gov.uk/patterns/question-pages/
- **In their words:** "You should make sure you know why you’re asking every question and only ask users for information you really need."
- **Do:** A question protocol: for each field, who uses the answer and what for; Reuse an earlier answer by pre-filling it rather than asking again; Let 'I do not know' be an answer where it is a valid one; Say why a sensitive question is asked, in its hint
- **Don't:** 'Nice to have' fields such as title, gender or 'how did you hear about us' with no stated use; Asking for an email or address a second time in the same journey; Confirm-email fields that make the user type the address twice, instead of playing it back for checking
- **Look at:** List every field on the form. For each, can the team name who reads the answer and what decision it changes? How many fields have no answer, and how many repeat information given earlier in the journey?
- **Unless:** Legal or regulatory questions whose use is mandated, which should still say why in a hint

## 61. `navigation.breadcrumbs-only-for-real-hierarchy`

Breadcrumbs belong on pages more than two levels deep in a hierarchy; never on a flat site, never to show steps in a linear flow, and never in place of the primary navigation.

- **Source:** GOV.UK Design System, *Breadcrumbs component* — https://design-system.service.gov.uk/components/breadcrumbs/
- **In their words:** "Do not use the breadcrumbs component on websites with a flat structure, or to show progress through a linear journey or transaction."
- **Do:** A trail that starts with the word 'Home' and follows the site's hierarchy, not the user's click history; Breadcrumbs placed at the top of the page, before <main>, so the skip link skips them; Every ancestor a link; the current page last and marked aria-current, or left off; Breadcrumb wording identical to the page titles it points at
- **Don't:** Breadcrumbs that list the steps of a sign-up or checkout; 'Home > About' on a site whose every page is linked from the top nav; Breadcrumbs as the only way to move between sections; Breadcrumbs and a Back link on the same page
- **Look at:** If the page has a breadcrumb (a nav whose accessible name contains 'breadcrumb', or an ordered list of links styled as one, before main): does it hold at least two ancestor links (Home > Section > page), does it sit before main, is every item except the current page a link, is there also a primary nav on the page, and is there no Back link and no step indicator on the same page?
- **Unless:** 'At least two ancestor links' is uxcli's reading of Carbon's 'more than two levels'; no source gives a link count; GOV.UK ends the trail with the parent section; Primer and USWDS end it with the current page marked aria-current; either passes; USWDS: omit breadcrumbs on the home page and optionally on section landing pages, and where a side navigation already shows the hierarchy; Carbon recognises path-based breadcrumbs (the steps the user took) as a type; GOV.UK and USWDS do not, and this viewpoint follows them

## 62. `navigation.skip-link-is-the-first-tab-stop`

The first Tab press on every page lands on a visible 'Skip to main content' link that moves focus past the header and navigation into main.

- **Source:** GOV.UK Design System, *Skip link component* — https://design-system.service.gov.uk/components/skip-link/
- **In their words:** "Including the skip link component gives users the option to bypass the top-level navigation links and jump to the main content on a page."
- **Do:** The skip link immediately after <body> (or after a cookie banner); Visually hidden until it receives keyboard focus, then clearly shown; A target id on <main> (or its first heading) that can take focus; Breadcrumbs and back links placed before <main>, so the skip link skips them too
- **Don't:** A page whose first Tab stop is the logo or the first of a dozen nav links; A skip link that stays invisible when focused; A skip link whose href points at an id that does not exist; A skip link wrapped in <nav> or moved inside the header
- **Look at:** Load the page and press Tab once: is document.activeElement an <a> whose href is '#id' of an element that is main or inside main, with a non-zero box inside the viewport and opacity above 0? Press Enter, then Tab: is focus on an element inside main?
- **Unless:** WCAG 2.4.1 is met by other means too (landmarks, headings); the first-Tab test follows GOV.UK and Carbon practice and is stricter than the criterion; WCAG: when the repeated navigation is at the bottom of the page, a skip link may be unnecessary; A page with no repeated block before main (a bare single-purpose page) has nothing to skip

## 63. `navigation.more-than-one-way-to-a-page`

Each page in a set can be reached more than one way — navigation plus search, a site map, an index or links between related pages — except pages that are a step in, or the result of, a process.

- **Source:** W3C WAI, *Understanding SC 2.4.5 Multiple Ways* — https://www.w3.org/WAI/WCAG22/Understanding/multiple-ways.html
- **In their words:** "Provide at least two options for reaching the same content."
- **Do:** A site search in the header that searches this site and says so ('Search [service]'); A site map, A–Z index or table of contents linked from the footer of every page; Related-page links inside content, in addition to the menu
- **Don't:** A large site whose only route to a page is a deep menu; A search box that searches something other than the site it sits on, without saying so
- **Look at:** On every page of a set larger than a handful: besides the nav landmark, is there a search form (role=search, or input[type=search]) or a link to a site map or index in the header or footer? Searching the h1 of a sampled deep page: does the search return that page?
- **Unless:** WCAG: for a three- or four-page site with every page linked from the home page, links to and from the home page can suffice; WCAG exempts pages that are the result of, or a step in, a process (a payment step, a search results page); 'Larger than a handful' is uxcli's threshold; WCAG applies the criterion to any set of pages and names no size

## 64. `navigation.pagination-says-where-and-how-many`

Pagination marks the current page, shows the first and last page (or says the set has no end), marks skipped pages with an ellipsis, drops Previous on the first page and Next on the last, and puts the page number in the title.

- **Source:** U.S. Web Design System (USWDS), *Pagination component* — https://designsystem.digital.gov/components/pagination/
- **In their words:** "Show the size of the paginated set. Users want to know the length of a paginated section."
- **Do:** aria-current="page" and a visible highlight on the current page number; The last page number as a link, or a trailing ellipsis when the set is unbounded; A non-selectable ellipsis wherever page numbers are skipped; A title such as 'Search results (page 3 of 12)'; Pagination directly below the list it pages, on one line
- **Don't:** Only 'Previous' and 'Next' with no indication of position or length; A Previous link on page 1 or a Next link on the last page; Pagination shown for a single page of results; Infinite scroll for content keyboard users must get past
- **Look at:** On page k of n: does the pagination nav contain page 1 and page n (or a trailing ellipsis when unbounded), mark k with aria-current and a style differing from its siblings, show an ellipsis wherever consecutive numbers skip, lack a Previous link when k = 1 and a Next link when k = n, and wrap onto no more than one line? Does document.title contain k? With one page of results, is the pagination absent?
- **Unless:** 'Load more' and infinite scroll are different patterns; GOV.UK advises against infinite scroll because it causes problems for keyboard users; Content split across pages (a guide in chapters) uses GOV.UK's block style: previous and next links labelled with the neighbouring pages' titles, no page numbers

## 65. `feedback.toasts-carry-nothing-critical`

A toast is only for a short, low-priority confirmation of something the user just did; an error that needs action, a warning, or anything the user cannot find again elsewhere goes in an inline message or banner that stays.

- **Source:** Shopify Polaris, *Toast component — Accessibility* — https://polaris.shopify.com/components/deprecated/toast
- **In their words:** "Avoid using toast for critical information that merchants need to act on immediately."
- **Do:** Short noun + verb confirmations: 'Product updated', 'Collection added'; Errors the user must fix shown next to the cause or in a banner that persists until resolved; Whatever the toast says also visible somewhere on the page after it goes (the saved value, the item in the list, a notifications area)
- **Don't:** A validation or payment error delivered only as a toast that auto-dismisses; A toast that holds the only copy of a generated password, link or code; Several sentences of explanation in a toast
- **Look at:** Record a walk through every action, including forced failures (offline, 4xx, 5xx). Treat as a toast any fixed- or absolute-positioned element with role=status|alert or aria-live that is removed or hidden within 15 s without user input. Count toasts whose text matches error/failed/could not/denied/invalid, toasts with more than 15 words, and toasts whose distinctive text (any token of 6+ characters other than common words) appears nowhere in the DOM 2 s after they leave. Count must be 0.
- **Unless:** Polaris allows an error toast for system errors not caused by the user, such as 'Internet disconnected', in 3 words; Polaris's own Toast component is deprecated in favour of the App Bridge Toast API; the guidance quoted is still on its page; The 15 s, 15-word and 6-character thresholds are uxcli's
