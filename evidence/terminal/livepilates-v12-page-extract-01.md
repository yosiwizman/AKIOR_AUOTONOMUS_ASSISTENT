# Live Pilates USA — V12 Product Page Extraction

**Extracted:** 2026-04-01T18:00Z
**Source:** https://www.livepilatesusa.com/product-page/v12-pilates
**Method:** Claude in Chrome — get_page_text + read_page (DOM) + 10-image visual carousel review
**Rule:** CONFIRMED DATA ONLY. No invented specs. Missing fields explicitly labeled.

---

## Section 1: Confirmed Product Data (from page text)

| Field | Confirmed Value | Source |
|-------|----------------|--------|
| Product name | V12 Pilates Machine | Page title + description |
| SKU | 00012 | Product page |
| Sale price | $9,995 USD | Price element |
| Regular price | $12,995 USD (struck through) | Price element |
| Tax note | Excluding Sales Tax | Page note |
| Frame material | Durable carbon steel | Product description |
| Movement system | 360-degree swivel board | Product description |
| Exercise options | 300+ | Product description |
| Warranty | **15 years** | Product description |
| Lead time | 20–45 days | Product description |
| Production method | Hand-built, manufactured in-house | Product description |
| Shipping included | Street or driveway drop-off included in price | Product description |
| Bulk pricing threshold | 5+ units qualify for discounted pricing | Product description |
| Bulk pricing process | Contact for quote | Product description |
| Color customization | Frame and leather colors — customizable | Product description |
| Color selection method | Consultation (no on-page selector) | DOM inspection — no variant UI found |
| Contact phone | +1-954-895-0972 | Wix chat / footer |

**Raw product description (verbatim from page):**
> "V12 Pilates Machine. Transform your workouts with the V12 Pilates Machine, the most innovative and versatile Pilates equipment on the market. Featuring a 360-degree swivel board and over 300 exercise options, it's perfect for Pilates, strength training, and rehabilitation. Built with durable carbon steel and customizable with your choice of frame and leather colors, the V12 combines style, performance, and reliability. Backed by a 15-year warranty, it's designed to elevate every fitness space. please allow between 20 and 45 days to be deliverd since we do manufactor these ourselves and they are hand built. This price is on a single unit, Any units of more than 5 qualify for discounted pricing contact us to get correct quote price includes street or driveway drop off."

---

## Section 2: Visual Color Data (from 10-image carousel)

All 10 product images show the **same color configuration**. No alternate color configurations are shown on the product page.

| Element | Observed Color | Confidence | Notes |
|---------|---------------|------------|-------|
| Main frame (arc + uprights) | Matte black | HIGH | Confirmed across all 10 images |
| Frame accent components (connectors, brackets) | Orange / amber | HIGH | Visible on top bar connectors, arc brackets |
| Arc decorative stripe 1 | Orange | HIGH | Runs parallel along inner arc edge |
| Arc decorative stripe 2 | Yellow / gold | MEDIUM | Visible in image 1 (close-up); may be same stripe under different lighting |
| Swivel board surface | Dark gray / black with orange edge | MEDIUM | Varies by image angle; image 3 shows more orange |
| Upholstery / padding | Dark (black or very dark gray) | MEDIUM | Visible on swivel board and frame pads |
| V12 logo (on base) | White on black | HIGH | Visible in multiple images |
| "LIVE" branding on uprights | White on black | HIGH | Visible on upright columns |

**Key finding:** The product description states colors are "customizable" — the page shows ONE standard configuration. Custom colors are selected by consultation, not via on-page UI. No color dropdown, radio buttons, or swatches exist in the DOM.

---

## Section 3: DOM Inspection Results

| Check | Result |
|-------|--------|
| Color variant selector | NOT FOUND |
| Size variant selector | NOT FOUND |
| Configurable product options | NOT FOUND |
| Contact/inquiry form on page | NOT FOUND (Wix chat widget present) |
| Product images in carousel | 10 images (ref_45 through ref_54) |
| All images — same color config? | YES |

---

## Section 4: Fields NOT Found on Product Page

The following data was searched for and confirmed absent from the product page:

| Missing Field | Why It Matters |
|--------------|----------------|
| Assembled dimensions (L × W × H) | Requested by Michelle Liu; needed for studio space planning |
| Assembled weight (net) | Requested by Michelle Liu; needed for floor load assessment |
| Packaging dimensions | Needed for accurate freight quote calculation |
| Gross weight (packaged) | Needed for freight quote |
| Max user weight capacity | Standard commercial equipment spec |
| Resistance system type | Springs, cables, or hybrid — not specified |
| Number of resistance elements | Standard spec for Pilates equipment |
| Power requirements | Electrical planning for studio |
| Certifications (CE, UL, etc.) | Required for commercial gym compliance in some regions |
| Accessories included in box | Client needs to know what arrives with machine |
| Full list of available frame colors | Only "customizable" stated — no color names given |
| Full list of upholstery colors | Same — no color names given |
| Color combination rules | Can any frame pair with any upholstery? |
| Non-standard color lead time impact | Does custom color add days to 20–45 day window? |

---

## Section 5: Additional Business Context Confirmed

| Item | Value | Notes |
|------|-------|-------|
| Website still active | YES | Product page fully loading |
| Live chat enabled | YES | Wix chat widget ("Let's Chat!") |
| Wix platform | YES | URL structure confirms Wix |
| Price discounted from MSRP | YES | $12,995 → $9,995 (23% off) |
| Single-unit price explicitly stated | YES | "This price is on a single unit" |
| Manufacturing location | In-house (implied domestic) | "we do manufactor these ourselves" |

---

*Page extraction complete. 17 confirmed data fields captured. 14 fields confirmed absent from product page. Color customization confirmed as consultation-based — not selectable on-site.*
