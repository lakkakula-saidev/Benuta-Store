# Benuta Store

A modern, production-ready e-commerce platform for carpets and home accessories, built with Next.js 16, featuring comprehensive error handling, and seamless API integration.

## ✨ Key Features

- 🛒 **Full E-commerce**: Product catalog, filtering, search, and shopping cart
- 🌐 **German Localization**: Complete German UI with proper SEO
- 🔒 **CORS Resolved**: API proxy routes eliminate browser restrictions
- ⚡ **Performance**: Optimized with React Query caching and Next.js features
- 🎨 **Modern UI**: Responsive design with Tailwind CSS
- 🛡️ **Production Ready**: Error boundaries, TypeScript, and comprehensive testing

## Installation

Install dependencies:

```bash
npm i
```

## Environment Setup

Copy `.env.example` to `.env.local` and fill in the required values:

```env
NEXT_PUBLIC_MAGENTO_ENDPOINT=https://b2b.benuta.com/graphql
MAGENTO_STORE_CODE=benuta_eu
CONTENTFUL_SPACE_ID=your_contentful_space_id_here
CONTENTFUL_ENV=master
CONTENTFUL_CDA_TOKEN=your_contentful_access_token_here
```

## Development

Generate GraphQL types:

```bash
npm run codegen
```

Start development server:

```bash
npm run dev
```

## Testing

Run tests:

```bash
npm run test
```

## Build & Production

Build and start production server:

```bash
npm run build && npm run start
```

## Features

### UI Components

- **Hero Banner**: Dynamic content slides with images and text from Contentful
- **Product Sliders**: Horizontal scrolling carousels for featured products (Popular carpets, Sale items)
- **Product Cards**: Rich product display with variant swatches, pricing, badges, and favorites
- **Navigation Bar**: Sticky header with shopping cart and favorites overlays
- **Catalog Page**: Advanced product filtering and sorting with drawer interface

### User Experience

- **Skeleton Loading**: Smooth loading states with animated placeholders
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Infinite Scroll**: Load more products automatically as you scroll
- **Grid Toggle**: Switch between 4 and 5 column product grids
- **Advanced Filtering**: Filter by color, price range, room type, material, and size
- **Shopping Cart**: Add/remove items with quantity controls
- **Favorites**: Save products for later viewing

### Technical Features

- **GraphQL Integration**: Type-safe queries with Magento and Contentful via API proxy routes
- **CORS Resolution**: Server-side API proxy eliminates browser CORS restrictions
- **State Management**: React Query for server state, custom hooks for UI state
- **Error Handling**: Comprehensive error boundaries and user-friendly error messages
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first styling with custom design system
- **Next.js 16**: App router with server and client components

## Vercel Deployment

live preview: - https://benuta-store.vercel.app/

## Setbacks: Unable to Achieve Price Filtering

- __Backend sort/filter:__ Used Magento `price_asc/price_desc` and `filter.price` but results were inconsistent with UI expectations.
- **Client fallback:** Tried `filterProductsByPrice` / `sortProductsByPrice` locally—worked visually but desynced totals and counts from Magento.
- **Search keyword trial:** Added `$search` for the winter slider, but Magento didn’t return matches; removed to avoid overfetching.
- **Hybrid approach:** Kept Magento sorting for canonical counts while deriving `saleItems` client-side for promo sliders—final approach balances accuracy with flexibility.
