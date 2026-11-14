import {
  HardDrive,
  Cpu,
  Laptop,
  Server,
  Usb,
  Smartphone,
  ShieldCheck,
  FileCheck2,
  Clock,
  Truck,
  FileKey,
  Users2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";

export type StorageCategory = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: typeof HardDrive;
  badge: string;
  commonIssues: string[];
  supportedBrands: string[];
};

export const STORAGE_CATEGORIES: StorageCategory[] = [
  {
    id: "hdd",
    title: "Hard Drive Data Recovery",
    shortTitle: "Hard Drive (HDD)",
    description: "External, desktop, and laptop mechanical hard drives. Specialized recovery for head crashes, motor seizures, and firmware corruption.",
    icon: HardDrive,
    badge: "Most Common",
    commonIssues: ["Clicking or knocking noises", "Drive spins down immediately", "Not detected in BIOS/OS", "Accidental format or deleted files", "Slow reading / bad sectors"],
    supportedBrands: ["Seagate", "Western Digital", "Toshiba", "Hitachi / HGST", "LaCie", "Samsung"],
  },
  {
    id: "ssd",
    title: "SSD & NVMe Data Recovery",
    shortTitle: "SSD & NVMe",
    description: "SATA, PCIe M.2, and NVMe solid-state drives. Advanced recovery for failed controller chips, corrupt NAND flash, and dead electronics.",
    icon: Cpu,
    badge: "High Tech",
    commonIssues: ["Drive detected with 0 MB capacity", "Controller chip failure", "System freeze on read", "Accidentally wiped partition", "Firmware panic state"],
    supportedBrands: ["Samsung EVO/PRO", "Crucial", "Kingston", "Western Digital Black/Blue", "SanDisk", "Transcend"],
  },
  {
    id: "mac",
    title: "MacBook & Apple Silicon Recovery",
    shortTitle: "MacBook & iMac",
    description: "MacBook Pro, MacBook Air, iMac, and Mac mini. Recovery from dead logic boards, liquid damage, and Apple T2/M-series hardware-encrypted storage.",
    icon: Laptop,
    badge: "Specialized",
    commonIssues: ["Liquid spill / corrosion", "Won't turn on / dead logic board", "Flashing folder with question mark", "Stuck on Apple logo", "FileVault recovery key issues"],
    supportedBrands: ["Apple M1 / M2 / M3 / M4", "Intel Macs with T2 Chip", "Older Retina MacBooks", "iMac & Mac Studio"],
  },
  {
    id: "raid",
    title: "RAID & Enterprise Server Recovery",
    shortTitle: "RAID & Server",
    description: "RAID 0, 1, 5, 6, 10, JBOD, and NAS/SAN appliances. Multi-disk rebuilds, corrupted volume recovery, and virtual machine data extraction.",
    icon: Server,
    badge: "Enterprise",
    commonIssues: ["Multiple degraded drives", "RAID controller failure", "Corrupt parity / rebuild crash", "Accidental volume deletion", "VMware / Hyper-V VMFS corruption"],
    supportedBrands: ["Synology", "QNAP", "Dell PowerEdge", "HP ProLiant", "Lenovo ThinkServer", "TrueNAS / FreeNAS"],
  },
  {
    id: "usb_sd",
    title: "USB Drive & Memory Card Recovery",
    shortTitle: "USB & SD Card",
    description: "Flash pen drives, SD cards, MicroSD, CFast, and CF cards. Direct chip-off NAND reading for physically broken or unrecognized flash media.",
    icon: Usb,
    badge: "Chip-off Lab",
    commonIssues: ["Snapped USB connector", "Please insert a disk error", "Card format prompt", "Memory card write-protected", "Dead controller IC"],
    supportedBrands: ["SanDisk", "Samsung", "Kingston", "Sony", "Lexar", "Transcend"],
  },
  {
    id: "mobile",
    title: "Mobile Phone Memory Recovery",
    shortTitle: "Mobile & Tablet",
    description: "Smartphones and tablets with severe hardware damage. Recovery from bent motherboards, water-damaged logic boards, and non-booting devices.",
    icon: Smartphone,
    badge: "Board Level",
    commonIssues: ["Water or fire damage", "Completely dead device", "Boot loop / memory error", "Cracked PCB traces", "Important WhatsApp & photos lost"],
    supportedBrands: ["Apple iPhone", "Samsung Galaxy", "Google Pixel", "OnePlus", "Xiaomi", "Vivo / Oppo"],
  },
];

export const TRUST_PILLARS = [
  {
    title: "Strict NDA & Confidentiality",
    description: "Your files never leave secure workstations. Standard Non-Disclosure Agreement (NDA) provided for all consumer and enterprise recovery cases.",
    icon: FileKey,
  },
  {
    title: "Dust-Controlled Lab Environment",
    description: "Mechanical drives are inspected under dedicated laminar flow clean workstations to protect sensitive platters from airborne particles.",
    icon: ShieldCheck,
  },
  {
    title: "See Your Files Before Paying",
    description: "After successful extraction, we provide a verified file list for your approval before you pay the final recovery invoice.",
    icon: FileCheck2,
  },
  {
    title: "Transparent Diagnostic Evaluation",
    description: "Comprehensive diagnostic report provided upfront detailing failure cause, recoverable file percentage, and fixed price quote.",
    icon: CheckCircle2,
  },
  {
    title: "Free Doorstep Pickup in Bengaluru",
    description: "Safe, cushioned doorstep device collection across Bengaluru and insured courier logistics pan-India.",
    icon: Truck,
  },
  {
    title: "Direct Access to Real Engineers",
    description: "Speak directly with the data recovery technician examining your device, not a scripted call center.",
    icon: Users2,
  },
];

export const RECOVERY_STEPS = [
  {
    step: "01",
    title: "Free Consultation & Booking",
    description: "Tell us what happened to your drive. Book free doorstep pickup in Bengaluru or generate an instant courier shipping label.",
  },
  {
    step: "02",
    title: "Safe Transport & Lab Arrival",
    description: "Your drive arrives at our Bengaluru lab, is logged into our secure chain-of-custody system, and given a unique Case ID.",
  },
  {
    step: "03",
    title: "Cleanroom Diagnosis & Fixed Quote",
    description: "We inspect the drive using hardware imagers and laminar flow benches. You receive a diagnostic report and fixed quote.",
  },
  {
    step: "04",
    title: "File Verification & Secure Return",
    description: "We extract your data to a secure external drive. You verify your critical files, approve the delivery, and get your data back safely.",
  },
];

export const PRICING_TIERS = [
  {
    id: "standard",
    name: "Standard",
    turnaround: "3–5 Business Days",
    idealFor: "Family photos, personal documents, and non-urgent files",
    features: [
      "Initial evaluation & diagnostic report",
      "Cleanroom inspection if required",
      "Transparent fixed quote before work",
      "File list verification before payment",
      "Free doorstep pickup in Bengaluru",
    ],
    popular: false,
  },
  {
    id: "priority",
    name: "Priority",
    turnaround: "24–48 Hours",
    idealFor: "Freelancers, business owners, and time-sensitive projects",
    features: [
      "Front-of-queue priority diagnostics",
      "Accelerated parts sourcing & imaging",
      "Daily progress updates via WhatsApp",
      "File list verification before payment",
      "Dedicated senior recovery engineer",
    ],
    popular: true,
  },
  {
    id: "emergency",
    name: "Emergency 24/7",
    turnaround: "Same-Day / 24 Hours",
    idealFor: "Mission-critical corporate servers, active databases, and emergency downtime",
    features: [
      "Immediate round-the-clock lab shift",
      "On-site engineer dispatch available",
      "Direct phone line to senior specialist",
      "Hourly status updates",
      "Encrypted secure cloud transfer or fast courier",
    ],
    popular: false,
  },
];

export const COMMON_FAQS = [
  {
    category: "General & Process",
    q: "My hard drive is making a clicking or beeping noise. What should I do?",
    a: "Immediately disconnect power and turn off the drive. A clicking or knocking sound indicates that the read/write heads have failed or are crashing against the spinning magnetic platters. Keeping the drive running can permanently scrape off the magnetic layer containing your data. Do not shake it or run software utilities.",
  },
  {
    category: "General & Process",
    q: "How does the recovery process work from start to finish?",
    a: "The process is simple: 1) Submit your request online to receive an instant Case ID (REC-...). 2) Hand over your device via free doorstep pickup in Bengaluru or courier. 3) Our lab engineers diagnose the failure and send a detailed diagnostic report with a fixed quote. 4) Upon your approval, we extract the data, let you verify the file list, and return your data on a secure backup drive.",
  },
  {
    category: "Technical & Safety",
    q: "Can you recover data from a dead MacBook that will not turn on?",
    a: "Yes. In modern MacBooks with Apple T2 or Apple Silicon (M1, M2, M3, M4), the SSD NAND chips are soldered directly onto the logic board and hardware-encrypted. We perform micro-soldering board-level repairs, trace diagnostics, and power-rail fixes to temporarily revive the board to safely extract your encrypted data.",
  },
  {
    category: "Technical & Safety",
    q: "Why shouldn't I try free recovery software on my damaged drive?",
    a: "Free data recovery software is only safe for simple deleted files on physically healthy storage. If your drive has bad sectors, failing read heads, or firmware instability, running software forces the drive to repeatedly attempt reading bad blocks, which often causes head crashes and catastrophic, irreversible platter damage.",
  },
  {
    category: "Technical & Safety",
    q: "Can you recover data from corrupted or failed RAID and NAS servers?",
    a: "Yes. We support all RAID architectures (RAID 0, 1, 5, 6, 10, JBOD) and file systems (VMFS, EXT4, Btrfs, ZFS, NTFS). We clone every member disk sector-by-sector before virtually reconstructing the array parameters (block size, parity rotation, disk order) without risking further disk degradation.",
  },
  {
    category: "Privacy & Legal",
    q: "How do you guarantee the confidentiality of my personal and business files?",
    a: "We adhere to strict data-protection and chain-of-custody protocols. Data extraction occurs on isolated offline workstations with zero internet connectivity. Standard Non-Disclosure Agreements (NDAs) are provided for all consumer and enterprise cases, and recovered data is permanently wiped from our transfer drives 7 days after confirmed handover.",
  },
  {
    category: "Pricing & Turnaround",
    q: "How much does hard drive data recovery cost?",
    a: "The cost depends on the nature of the damage: simple logical recovery (deleted files, partition corruption) starts at competitive baseline rates, while mechanical failures requiring donor head assembly replacements in a clean environment are quoted based on required donor parts. We always provide a fixed, binding quote after diagnosis before any work starts.",
  },
  {
    category: "Pricing & Turnaround",
    q: "Do I have to pay if my data cannot be recovered?",
    a: "We operate with complete transparency. Following our diagnostic evaluation, you receive a detailed report and file tree list of recoverable data to review and approve before proceeding with the final recovery.",
  },
  {
    category: "Logistics",
    q: "How does doorstep pickup work, and do you serve cities outside Bengaluru?",
    a: "We offer free, cushioned doorstep collection across Bengaluru. For customers outside Bengaluru (Mumbai, Delhi, Hyderabad, Chennai, Pune, etc.), we provide insured courier pickup instructions so your media is packaged safely and delivered straight to our lab.",
  },
  {
    category: "Enterprise",
    q: "Do you offer on-site data recovery for businesses?",
    a: "Yes. For corporate clients, financial institutions, and data centers where compliance policies prevent storage devices from leaving company premises, we dispatch senior engineers with portable hardware imagers and diagnostics tools directly to your facility under corporate NDA.",
  },
];

export const LAB_CONTACT = {
  phone: "+91 98458 63602",
  phoneFormatted: "+91 98458 63602",
  whatsapp: "919845863602",
  email: "support@looplic.com",
  labAddress: "1st Floor, Shawkat Building, SJP Road, Nagarathpete, Bengaluru 560002",
  workingHours: "Mon – Sat: 10:00 AM – 8:00 PM IST",
  emergencyLine: "24/7 Emergency Line for Critical Business Recoveries",
  coordinates: {
    lat: 12.9632,
    lng: 77.5784,
  },
};
