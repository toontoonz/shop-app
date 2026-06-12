---
inclusion: always
---

# Product Context

## Summary
- **Product**: Multi-seller e-commerce web app — buyer storefront with anonymous mock-payment checkout plus seller backend with order management and sales analytics.
- **Users**: Buyer (anonymous shopper), Seller (authenticated marketplace vendor)
- **Type**: Greenfield — New product

## Overview

A web-based marketplace with two sides: a public storefront where buyers browse products from multiple sellers, add items to a cart, select a mock payment method, and submit their contact information; and an authenticated seller backend that lists orders by five statuses (ordered, paid, packing, shipped, cancelled), lets sellers manage their products and update order statuses, and shows sales analytics including a top-seller leaderboard and top-selling products. Payment is mocked — no external payment API is called.

## Problem Statement

Small sellers need a lightweight marketplace storefront that lets them list products, capture buyer orders, fulfill them through clear status stages, and benchmark their performance against other sellers — without integrating a real payment processor. Existing platforms either require real payment integration upfront, force buyers to create accounts before purchasing, or fail to give sellers a unified order pipeline plus comparative analytics.

## Target Users

- **Buyer (Persona: คุณนภา)**: Anonymous shopper who browses the storefront, adds items to a cart, enters required name and phone (optional email), picks a mock payment method, and places an order in a single session without registering an account.
- **Seller (Persona: คุณภูมิ)**: Authenticated marketplace vendor (account created by an admin) who logs into the backend to manage their own products, view their orders by status, manually advance or cancel order statuses, and view sales analytics including a leaderboard comparing them to other sellers.

## Key Features

- **Seller authentication**: Login, logout, and session-based access control. Admin-issued credentials only.
- **Product catalog management**: Sellers create, edit, and delete their own products; out-of-stock products are flagged as "สินค้าหมด" on the storefront.
- **Storefront browsing**: Buyers view a unified product list from all sellers and view product detail pages.
- **Cart and mock checkout**: Buyers add items, adjust quantities, enter required name/phone (and optional email), and select one of four mock payment methods (Bank Transfer, Cash on Delivery, e-Wallet, Credit Card). No external payment API is called.
- **Order placement**: Submitting checkout creates one order per seller with line items, captured buyer info, mock payment method, and "ordered" status. Stock is decremented atomically.
- **Order management**: Sellers view orders for their own products, filter by status, manually advance status forward (ordered → paid → packing → shipped), or cancel non-shipped orders (which restores stock).
- **Sales analytics**: Sales-over-time chart, orders-by-status chart, top-seller leaderboard (ranked by revenue), and top-selling products panel — all filterable by preset time ranges (Today / 7d / 30d / This month / This year).

## Domain Language

| Term | Definition | Example |
|------|-----------|---------|
| Buyer | Anonymous user who shops on the storefront and places orders | "Buyer fills in name and phone at checkout" |
| Seller | Authenticated vendor who lists products and manages their own orders in the backend | "Seller logs in to view today's orders" |
| Admin | Out-of-band actor who creates Seller credentials (no admin UI in MVP) | "Admin issues a Seller account" |
| Product | A catalog item owned by exactly one Seller | "Product 'Mug A' belongs to Seller B" |
| Cart | Session-scoped collection of products and quantities the Buyer is preparing to order | "Buyer's cart contains 2 items" |
| Order | A purchase record created when a Buyer completes checkout — one Order per Seller | "Order #1024 is for Seller B" |
| Order Item | A line within an Order, capturing product, quantity, and unit price at time of order | "Order #1024 has 3 line items" |
| Buyer Info | Name (required), phone (required), email (optional) captured per Order | "Buyer info for Order #1024" |
| Order Status | One of five lifecycle stages | ordered → paid → packing → shipped, or cancelled |
| Mock Payment | Payment-method choice recorded with the Order without calling any external payment API | "Buyer selects Bank Transfer as mock payment" |
| Storefront | The public buyer-facing pages | "Storefront shows product list" |
| Backend | The authenticated seller-facing pages | "Backend dashboard shows analytics" |
| Top Seller | A Seller ranked on the analytics leaderboard by total revenue from non-cancelled, paid+ orders | "Top seller this month: Seller A" |

## Success Criteria

- A Buyer can browse the storefront, add items to a cart, fill in the required info (name, phone), select a mock payment method, place an order, and see a confirmation in a single session
- A Seller can log in and view all of their own orders, filter by any of the five statuses (ordered, paid, packing, shipped, cancelled), and see counts per status
- A Seller can manually advance an order forward (ordered → paid → packing → shipped) and cancel any non-shipped order, with stock restored on cancel
- The analytics dashboard displays a sales-over-time chart, an orders-by-status chart, a top-seller leaderboard, and a top-selling-products panel — all filterable by the five preset time ranges
- All required Buyer fields (name, phone) are validated; optional email is accepted only when provided in valid format
- No external payment API is ever called

## Constraints & Assumptions

**Constraints**:
- Timeline: Standard MVP — 1 to 2 months
- Team: Solo developer (1 person)
- Technical: Payment is mocked. No real payment API integration in this MVP.
- Localization: Thai-only UI
- Out of scope (per D1-11): real payment integration, email/SMS notifications, shipping/tracking integration, reviews/ratings, advanced inventory (low-stock alerts, auto-reorder), promotions/coupons, refund workflow, buyer accounts, self-service seller signup

**Assumptions**:
- Buyers do not need accounts to shop (anonymous checkout)
- Sellers receive credentials from an admin out-of-band; the admin UI itself is out of scope for this MVP
- Sales metrics include orders whose status is paid, packing, or shipped (cancelled and ordered-but-unpaid are excluded from revenue totals)
- Stock decrement on order placement is atomic; cancellation restores stock
- Order volume for MVP is in the low thousands per month — single deployment, single database is sufficient

## Project Type

- **Type**: Greenfield
- **Scope**: New product
