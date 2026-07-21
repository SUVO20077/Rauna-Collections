/**
 * products.js
 * ------------------------------------------------------------------
 * Realistic product catalog for the RAUNA storefront demo.
 * In a real backend-connected build, `RAUNA.PRODUCTS` would instead
 * be hydrated from an API response — every other module only reads
 * from this array/lookup, so swapping the source later is a one-file change.
 * ------------------------------------------------------------------
 */
window.RAUNA = window.RAUNA || {};

(function () {

  // Inline line-art SVG paths, reused from the homepage's illustrated
  // product cards so dynamically-rendered cards (search/cart/wishlist)
  // stay visually identical to the rest of the site.
  const ICONS = {
    tee: '<path d="M32 22 20 28l5 13 7-4v39h36V37l7 4 5-13-12-6-9 6H41l-9-6Z"/>',
    hoodie: '<path d="M30 24 20 30l4 12 6-3v37h40V39l6 3 4-12-10-6-8 6H38l-8-6Z"/><path d="M40 24c1 5 5 8 10 8s9-3 10-8"/>',
    mug: '<path d="M28 30h34v34a8 8 0 0 1-8 8H36a8 8 0 0 1-8-8V30Z"/><path d="M62 38h8a8 8 0 0 1 0 16h-8"/>',
    tote: '<path d="M30 34h40l4 46H26l4-46Z"/><path d="M38 34v-8a12 12 0 0 1 24 0v8"/>',
    cap: '<path d="M20 56c0-16 13-29 30-29s30 13 30 29"/><path d="M20 56h60l6 8H14l6-8Z"/>',
    bottle: '<rect x="38" y="16" width="24" height="10" rx="2"/><path d="M34 30c0-2 2-4 4-4h24c2 0 4 2 4 4v46a8 8 0 0 1-8 8H42a8 8 0 0 1-8-8V30Z"/>',
  };

  /** Returns the illustrated product-art HTML for any product object. */
  function artHTML(product) {
    const icon = ICONS[product.art] || ICONS.tee;
    return `<div class="art art-${product.art}"><svg viewBox="0 0 100 100" fill="none" stroke="#3b2f1c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icon}</svg></div>`;
  }

  const PRODUCTS = [
    {
      id: 'p1', name: 'Ink Bloom Oversized Tee', category: 'Oversized Tee', collection: 'Everyday Edit',
      brand: 'RAUNA', description: 'Heavyweight 240gsm cotton oversized tee with a hand-drawn ink bloom print.',
      price: 699, mrp: 999, rating: 4.6, reviews: 214, stock: 'in',
      colors: ['Ink Black', 'Bone White'], sizes: ['S', 'M', 'L', 'XL'],
      tags: ['tee', 'oversized', 'streetwear', 'cotton', 'best seller'],
      sku: 'RAU-TEE-001', art: 'tee', customizable: true, isNew: false, isBestseller: true,
    },
    {
      id: 'p2', name: 'Brass Line Pullover Hoodie', category: 'Hoodie', collection: 'Monsoon Edit',
      brand: 'RAUNA', description: 'Brushed fleece pullover hoodie with a minimal brass-line embroidery detail.',
      price: 1499, mrp: 1499, rating: 4.8, reviews: 356, stock: 'in',
      colors: ['Charcoal', 'Sand Gold'], sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      tags: ['hoodie', 'pullover', 'winter', 'fleece', 'best seller'],
      sku: 'RAU-HOD-002', art: 'hoodie', customizable: true, isNew: false, isBestseller: true,
    },
    {
      id: 'p3', name: 'Golden Hour Photo Mug', category: 'Coffee Mug', collection: 'Studio Picks',
      brand: 'RAUNA', description: 'Ceramic 325ml mug, dishwasher safe, printed with your own photo or design.',
      price: 349, mrp: 349, rating: 4.5, reviews: 128, stock: 'in',
      colors: ['White', 'Matte Black'], sizes: ['325ml'],
      tags: ['mug', 'coffee', 'gift', 'ceramic', 'photo print'],
      sku: 'RAU-MUG-003', art: 'mug', customizable: true, isNew: true, isBestseller: false,
    },
    {
      id: 'p4', name: 'Canvas Lotus Tote', category: 'Tote Bag', collection: 'Studio Picks',
      brand: 'RAUNA', description: '12oz heavyweight canvas tote with reinforced handles and the RAUNA lotus motif.',
      price: 549, mrp: 549, rating: 4.7, reviews: 91, stock: 'low',
      colors: ['Natural Canvas', 'Ink Black'], sizes: ['One Size'],
      tags: ['tote', 'bag', 'canvas', 'everyday', 'eco'],
      sku: 'RAU-TOT-004', art: 'tote', customizable: true, isNew: false, isBestseller: false,
    },
    {
      id: 'p5', name: 'Embroidered Wordmark Cap', category: 'Cap', collection: 'Everyday Edit',
      brand: 'RAUNA', description: 'Structured 6-panel cap with an embroidered RAUNA wordmark and adjustable strap.',
      price: 449, mrp: 599, rating: 4.4, reviews: 76, stock: 'in',
      colors: ['Black', 'Olive', 'Cream'], sizes: ['Free Size'],
      tags: ['cap', 'headwear', 'embroidery', 'accessory'],
      sku: 'RAU-CAP-005', art: 'cap', customizable: true, isNew: false, isBestseller: false,
    },
    {
      id: 'p6', name: 'Matte Steel Sipper Bottle', category: 'Water Bottle', collection: 'Studio Picks',
      brand: 'RAUNA', description: 'Double-wall insulated 750ml steel bottle, keeps drinks cold for 18 hours.',
      price: 599, mrp: 799, rating: 4.6, reviews: 143, stock: 'in',
      colors: ['Matte Steel', 'Sand Gold'], sizes: ['750ml'],
      tags: ['bottle', 'sipper', 'steel', 'insulated', 'gym'],
      sku: 'RAU-BOT-006', art: 'bottle', customizable: true, isNew: true, isBestseller: false,
    },
    {
      id: 'p7', name: 'Classic Weave Polo', category: 'Polo Tee', collection: 'Everyday Edit',
      brand: 'RAUNA', description: 'Breathable pique-knit polo with a tipped collar, built for everyday wear.',
      price: 799, mrp: 799, rating: 4.3, reviews: 58, stock: 'in',
      colors: ['Navy', 'Bone White', 'Ink Black'], sizes: ['S', 'M', 'L', 'XL'],
      tags: ['polo', 'tee', 'collar', 'office casual'],
      sku: 'RAU-POL-007', art: 'tee', customizable: false, isNew: false, isBestseller: false,
    },
    {
      id: 'p8', name: 'Etched Lotus Phone Case', category: 'Phone Cover', collection: 'Studio Picks',
      brand: 'RAUNA', description: 'Shock-resistant phone case with an etched lotus emblem, slim profile.',
      price: 399, mrp: 399, rating: 4.2, reviews: 39, stock: 'in',
      colors: ['Clear', 'Ink Black'], sizes: ['iPhone', 'Android'],
      tags: ['phone case', 'accessory', 'etched', 'gift'],
      sku: 'RAU-PHN-008', art: 'mug', customizable: true, isNew: true, isBestseller: false,
    },
    {
      id: 'p9', name: 'Heavyweight Crew Sweatshirt', category: 'Sweatshirt', collection: 'Monsoon Edit',
      brand: 'RAUNA', description: '400gsm loopback cotton crewneck sweatshirt with a raised RAUNA chest print.',
      price: 1199, mrp: 1399, rating: 4.5, reviews: 64, stock: 'in',
      colors: ['Charcoal', 'Bone White'], sizes: ['S', 'M', 'L', 'XL'],
      tags: ['sweatshirt', 'crewneck', 'winter', 'cotton'],
      sku: 'RAU-SWT-009', art: 'hoodie', customizable: true, isNew: true, isBestseller: false,
    },
    {
      id: 'p10', name: 'Trail Track Joggers', category: 'Joggers', collection: 'Everyday Edit',
      brand: 'RAUNA', description: 'Tapered fit joggers in brushed fleece with zip pockets and ribbed cuffs.',
      price: 999, mrp: 1199, rating: 4.4, reviews: 47, stock: 'in',
      colors: ['Charcoal', 'Ink Black'], sizes: ['S', 'M', 'L', 'XL'],
      tags: ['joggers', 'trackpants', 'bottoms', 'athleisure'],
      sku: 'RAU-JOG-010', art: 'tee', customizable: false, isNew: false, isBestseller: false,
    },
    {
      id: 'p11', name: 'Canvas Lotus Keychain', category: 'Key Chain', collection: 'Studio Picks',
      brand: 'RAUNA', description: 'Compact canvas-and-brass keychain with the RAUNA lotus emblem stamp.',
      price: 199, mrp: 249, rating: 4.6, reviews: 22, stock: 'in',
      colors: ['Natural Canvas'], sizes: ['One Size'],
      tags: ['keychain', 'accessory', 'small gift'],
      sku: 'RAU-KEY-011', art: 'tote', customizable: false, isNew: false, isBestseller: false,
    },
    {
      id: 'p12', name: 'Enamel Wordmark Badge', category: 'Badge', collection: 'Studio Picks',
      brand: 'RAUNA', description: 'Hard-enamel pin badge with the RAUNA wordmark, gold-plated finish.',
      price: 149, mrp: 149, rating: 4.7, reviews: 18, stock: 'low',
      colors: ['Gold'], sizes: ['One Size'],
      tags: ['badge', 'pin', 'enamel', 'accessory'],
      sku: 'RAU-BDG-012', art: 'mug', customizable: false, isNew: true, isBestseller: false,
    },
  ];

  // O(1) lookup by id, used constantly by cart/wishlist rendering.
  const BY_ID = {};
  PRODUCTS.forEach((p) => (BY_ID[p.id] = p));

  RAUNA.PRODUCTS = PRODUCTS;
  RAUNA.getProduct = (id) => BY_ID[id] || null;
  RAUNA.productArtHTML = artHTML;
})();
