"use client";

import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { HomepageNavbar } from "@/src/components/next/HomepageNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";

const FAQ_CATEGORIES = [
  {
    id: "sell",
    title: "Sell",
    items: [
      { q: "How does the sell process work?", a: "It's simple — search your device, answer a few condition questions, get an instant quote, and book a free doorstep pickup. Our executive picks up the device, verifies it, and pays you instantly via UPI or bank transfer." },
      { q: "How is the price determined?", a: "The price is based on your device's model, storage variant, and condition. Factors like screen condition, battery health, functional issues, and accessories affect the final price. Our algorithm gives you the best market rate." },
      { q: "What if the final offer is different from the online quote?", a: "In rare cases, if our executive finds undisclosed issues during the physical inspection, the price may be revised. You can always decline the revised offer — there's no obligation to sell." },
      { q: "How quickly will I get paid?", a: "Payment is instant! Our executive transfers the money via UPI or IMPS before leaving your doorstep. No waiting, no delays." },
      { q: "Can I sell a damaged or non-working device?", a: "Yes! We buy devices in any condition — broken screen, dead battery, water damage, or completely dead. The price adjusts based on the condition, but you'll still get cash." },
      { q: "What about my personal data?", a: "Our executive performs a certified factory reset on the spot, right in front of you. Your data is completely wiped before the device leaves your hands." },
    ],
  },
  {
    id: "buy",
    title: "Buy",
    items: [
      { q: "Are refurbished devices reliable?", a: "Absolutely! Every device goes through a rigorous 32-point quality check. We test the display, battery, cameras, sensors, and all functionalities. Only devices that pass all tests are listed for sale." },
      { q: "What's the difference between condition grades?", a: "Fair: visible scratches/dents, fully functional. Good: minor signs of use. Excellent: minimal wear, looks almost new. Superb: virtually indistinguishable from new. Unboxed: sealed/opened box, never used." },
      { q: "What warranty do refurbished devices come with?", a: "All refurbished devices come with a 6-month comprehensive warranty covering manufacturing defects and hardware issues. This is a no-questions-asked warranty." },
      { q: "Can I return a refurbished device?", a: "Yes! We offer a 15-day replacement guarantee. If you're not satisfied or find any issue, we'll replace the device or give you a full refund." },
      { q: "Do refurbished phones come with accessories?", a: "Yes, all phones come with a charger and cable. Original boxes and earphones depend on availability and are mentioned in the product listing." },
    ],
  },
  {
    id: "repair",
    title: "Repair",
    items: [
      { q: "Is the pickup really free?", a: "Yes, doorstep pickup is completely free. Our executive comes to your location at your preferred time — no hidden charges." },
      { q: "What cities do you serve?", a: "We currently serve all major metros and Tier-1 cities including Bangalore, Mumbai, Delhi, Chennai, Hyderabad, Pune, Kolkata, and many more. Enter your pincode to check availability." },
      { q: "Can I reschedule my pickup?", a: "Yes, you can reschedule or cancel your pickup anytime before the executive arrives. Just use the tracking page or call our support team." },
      { q: "How long does a repair take?", a: "Most repairs are completed within 30 minutes at your doorstep. Complex repairs like motherboard issues may take 2-3 hours." },
    ],
  },
  {
    id: "general",
    title: "General",
    items: [
      { q: "What payment methods do you accept for buying?", a: "We accept all major payment methods — UPI, credit/debit cards, net banking, and EMI options through leading banks. We also offer 0% cost EMI on select products." },
      { q: "Is EMI available?", a: "Yes! We offer EMI options from 3 to 12 months on all refurbished products. 0% cost EMI is available on select credit cards and products." },
      { q: "How do I claim warranty on a refurbished device?", a: "Simply contact our support team via WhatsApp or email with your order ID. We'll arrange a pickup, diagnose the issue, and repair or replace the device — all free of cost within warranty period." },
      { q: "What's NOT covered under warranty?", a: "Physical damage (drops, water damage), software issues, and accessories are not covered. The warranty covers manufacturing defects and hardware failures that occur during normal use." },
      { q: "How do I contact support?", a: "You can reach us via WhatsApp, email at support@looplic.com, or call our helpline. Our support team is available Monday to Saturday, 10 AM to 7 PM." },
    ],
  },
];

function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-medium text-gray-900 pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="size-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 pr-8">
          <p className="text-sm leading-relaxed text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  );
}

export function FaqPageView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("sell");

  const currentCategory = FAQ_CATEGORIES.find((cat) => cat.id === activeTab);

  const filteredItems = currentCategory
    ? currentCategory.items.filter(
        (item) =>
          item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // If search is active, search across all categories
  const searchResults = searchQuery.trim()
    ? FAQ_CATEGORIES.flatMap((cat) =>
        cat.items
          .filter(
            (item) =>
              item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.a.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((item) => ({ ...item, category: cat.title }))
      )
    : null;

  return (
    <div className="min-h-screen bg-white">
      <HomepageNavbar />

      {/* Header */}
      <section className="border-b border-gray-100 bg-white px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Frequently Asked Questions</h1>
          <p className="mt-2 text-sm text-gray-500">Find answers to common questions about our services.</p>

          {/* Search */}
          <div className="relative mx-auto mt-6 max-w-md">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for a question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>
      </section>

      {/* Category Tabs + Content */}
      <section className="mx-auto max-w-3xl px-4 py-8">
        {/* Tabs */}
        {!searchQuery.trim() && (
          <div className="mb-6 flex gap-1 border-b border-gray-200">
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === cat.id
                    ? "border-b-2 border-green-600 text-green-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>
        )}

        {/* FAQ Items */}
        {searchQuery.trim() ? (
          // Search results across all categories
          searchResults && searchResults.length > 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white px-5">
              {searchResults.map((item, index) => (
                <AccordionItem key={index} question={item.q} answer={item.a} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-10 text-center">
              <p className="text-sm font-medium text-gray-900">No matching questions found.</p>
              <p className="mt-1 text-xs text-gray-500">Try a different search term.</p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Clear Search
              </button>
            </div>
          )
        ) : (
          // Category-based FAQ
          filteredItems.length > 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white px-5">
              {filteredItems.map((item, index) => (
                <AccordionItem key={index} question={item.q} answer={item.a} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-10 text-center">
              <p className="text-sm text-gray-500">No questions in this category.</p>
            </div>
          )
        )}

        {/* Contact CTA */}
        <div className="mt-12 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <h3 className="text-lg font-bold text-gray-900">Still have questions?</h3>
          <p className="mt-2 text-sm text-gray-500">Our support team is ready to help you.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700"
            >
              Chat on WhatsApp
            </a>
            <a
              href="mailto:support@looplic.com"
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Email Support
            </a>
          </div>
        </div>
      </section>

      <HomepageFooter />
    </div>
  );
}
