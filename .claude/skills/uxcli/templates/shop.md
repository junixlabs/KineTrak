# Online shop — the `shop` template

E-commerce and marketplaces: people browse, compare, buy, and come back for their order.

A template is where research starts, not what it found. Nothing below is a fact about this product's users: the screens and journeys are what products of this kind usually have, and every question is yours to answer from a source before it becomes an insight. `uxcli template apply shop` writes the actor questions into `.uxcli/understanding/actors/`; `references/research.md` in this skill is how to answer them.

## Who uses it

### `first_time_shopper`

Someone who arrived from search or an ad and has never bought here.

- What were they looking for when they arrived, in their own words?
- What do they need to know before trusting this shop with a payment?
- Which device do they buy on, and do they start on one device and finish on another?
- What costs or conditions would make them abandon at checkout (delivery price, delivery date, returns)?
- How do they compare products: by price, by a spec, by reviews, by photos?

### `returning_customer`

Someone who has bought before and comes back to buy again or to check an order.

- Why do they come back: to reorder, to track, to return?
- Do they expect to be signed in, and what happens if they are not?
- What would they need to see to resolve an order problem without contacting support?

## Screens, and the lens each is read against

| Screen | Lens | What the person does there |
|---|---|---|
| Catalogue or category (`catalogue`) | `shop` | Browses a range and narrows it down. |
| Search results (`search-results`) | `shop` | Finds the product they have in mind, or a close alternative. |
| Product page (`product`) | `shop` | Decides whether this is the right product at the right total price and delivery date. |
| Cart (`cart`) | `transaction` | Checks what they are buying and what it will cost in total. |
| Checkout (`checkout`) | `transaction` | Gives delivery and payment details once and places the order. |
| Order confirmation (`confirmation`) | `transaction` | Knows the order went through and what happens next. |
| Order history (`orders`) | `workspace` | Finds an order, sees where it is, and starts a return. |

## Journeys to walk first

### `find-and-buy` — Find a product and buy it

Actor `first_time_shopper`, through: `search-results` → `product` → `cart` → `checkout` → `confirmation`.

Watch when you walk it:

- The total cost, including delivery, is visible before the last step.
- Checkout can be finished without creating an account.
- Count the form fields in checkout; each must be needed to deliver or to charge.
- An error in checkout keeps everything the shopper already typed.

### `compare-and-choose` — Narrow a range down to one product

Actor `first_time_shopper`, through: `catalogue` → `product` → `catalogue` → `product`.

Watch when you walk it:

- Filters apply without losing scroll position, and say how many results remain.
- Going back from a product returns to the same place in the list.
- The facts people compare on are in the same place on every product page.

### `track-and-return` — Find a past order and start a return

Actor `returning_customer`, through: `orders` → `confirmation`.

Watch when you walk it:

- The order's current status and expected date are visible without opening a sub-page.
- The return starts from the order, not from a help article.
- Every step says what happens next and when.

## What to research about the domain

- What do shoppers in this category need to see before buying (sizes, compatibility, ingredients, warranty)?
- Which delivery, payment and return options are expected in this market, and which are legally required?
- What do customer reviews of this shop and its competitors complain about most?
- What share of traffic is on phones, and where does it come from (search, social, email)?
- Which local conventions matter: currency format, address format, phone format, tax shown or not?

## Where research starts

- [Baymard Institute — e-commerce UX research](https://baymard.com/research) — Large-sample usability research on product pages, search, cart and checkout.
- [Nielsen Norman Group — 10 usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) — The baseline vocabulary for reviewing any screen.
- [Shopify Polaris](https://polaris.shopify.com/) — Commerce patterns and content guidelines from a platform that runs many shops.
- [GOV.UK Design System — patterns](https://design-system.service.gov.uk/patterns/) — Researched patterns for addresses, payment details, errors and confirmation pages.
