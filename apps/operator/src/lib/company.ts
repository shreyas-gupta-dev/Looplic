export const companyName = "Looplic";
export const supportEmail = "support@looplic.com";
export const supportPhone = "8884445206";
export const supportPhoneDisplay = "+91 88844 45206";
export const whatsappPhone = "8884445924";
export const whatsappPhoneDisplay = "+91 88844 45924";
export const whatsappUrl = `https://wa.me/91${whatsappPhone}`;
export const companyRegisteredAddress = "SJP Road, Bengaluru, Karnataka 560002";
export const companyWebsite = "looplic.com";
// Optional GSTIN — invoices render the GSTIN row only when this is configured.
export const companyGstin = (process.env.NEXT_PUBLIC_COMPANY_GSTIN || "").trim();

export const footerLinks = [
  { href: "/bangalore", label: "Bangalore" },
  { href: "/service/mobile-repair", label: "Mobile Repair" },
  { href: "/samsung-screen-replacement", label: "Samsung Screen Replacement" },
  { href: "/blog", label: "Blog" },
  { href: "/about-us", label: "About Us" },
  { href: "/contact-us", label: "Contact Us" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
] as const;
