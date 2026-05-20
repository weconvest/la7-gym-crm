import { uid, daysBetween } from "../lib/helpers.js";
import { PACKAGES, RECEIPT_PLACEHOLDER } from "../lib/constants.js";

// ============================================================================
// SEED COACHES & STAFF
// ============================================================================
export const seedCoaches = [
  {
    id: "c1",
    name: "Khaled Mansour",
    specialization: "Strength & Conditioning",
    phone: "010-1111-1001",
    email: "khaled@la7.gym",
  },
  {
    id: "c2",
    name: "Yara Ibrahim",
    specialization: "HIIT & Cardio",
    phone: "010-1111-1002",
    email: "yara@la7.gym",
  },
  {
    id: "c3",
    name: "Omar Selim",
    specialization: "Powerlifting",
    phone: "010-1111-1003",
    email: "omar@la7.gym",
  },
];

export const seedStaff = [
  { id: "f1", name: "Sara Founder", role: "founder", phone: "010-9999-0001", email: "sara@la7.gym", paymentPin: "0000" },
  { id: "gm1", name: "Tarek Hassan", role: "general_manager", phone: "010-9999-0002", email: "tarek@la7.gym", paymentPin: "0000" },
  { id: "cm1", name: "Nour El-Din", role: "coaches_manager", phone: "010-9999-0003", email: "nour@la7.gym", paymentPin: "0000" },
  { id: "clm1", name: "Heba Mostafa", role: "classes_manager", phone: "010-9999-0006", email: "heba@la7.gym", paymentPin: "0000" },
  { id: "ac1", name: "Maged Refaat", role: "accountant", phone: "010-9999-0007", email: "maged@la7.gym", paymentPin: "0000" },
  { id: "s1", name: "Mariam Adel", role: "front_desk", phone: "010-9999-0004", email: "mariam@la7.gym", paymentPin: "0000" },
  { id: "s2", name: "Hossam Fathy", role: "front_desk", phone: "010-9999-0005", email: "hossam@la7.gym", paymentPin: "0000" },
];

const memberNames = [
  "Ahmed Hassan", "Layla Rashid", "Mostafa Salah", "Nadia Farouk", "Karim Anwar",
  "Salma Gamal", "Youssef Magdy", "Hana Khalil", "Tamer Said", "Reem Aboud",
  "Ziad Nassar", "Mona Sherif", "Fares Helmy", "Dina Naguib", "Bassem Wagdi",
  "Amira Halim", "Sherif Tawfik", "Iman Ezzat",
];

// ============================================================================
// GENERATE SEED DATA — synthesizes realistic gym activity
// ============================================================================
export function generateSeed() {
  const members = [], subscriptions = [], payments = [], attendance = [];
  const now = new Date();
  const monthsBack = (n) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - n);
    return d;
  };
  const frontDeskIds = ["s1", "s2"];

  memberNames.forEach((name, idx) => {
    const memberId = `m${idx + 1}`;
    const phone = `010-${String(2000 + idx).padStart(4, "0")}-${String(3000 + idx * 7).padStart(4, "0")}`;
    members.push({ id: memberId, name, phone });

    const subCount = 1 + Math.floor(Math.random() * 2);
    for (let s = 0; s < subCount; s++) {
      const types = ["PT", "Class", "Nutrition"];
      const type = types[Math.floor(Math.random() * types.length)];
      const pkgList = PACKAGES[type];
      const pkg = pkgList[Math.floor(Math.random() * pkgList.length)];
      const coach = seedCoaches[Math.floor(Math.random() * seedCoaches.length)];

      const monthsAgo = Math.floor(Math.random() * 3);
      const start = monthsBack(monthsAgo);
      start.setDate(1 + Math.floor(Math.random() * 25));
      const end = new Date(start);
      end.setDate(end.getDate() + pkg.days);

      const isOldExpired = monthsAgo >= 2 && Math.random() > 0.4;
      const sessionsUsed = isOldExpired
        ? pkg.sessions
        : Math.floor(Math.random() * pkg.sessions);
      const sessionsRemaining = Math.max(0, pkg.sessions - sessionsUsed);

      const subId = uid();
      const payId = uid();
      const methods = ["Cash", "Visa", "Bank Transfer"];
      const method = methods[Math.floor(Math.random() * methods.length)];
      const fdId = frontDeskIds[Math.floor(Math.random() * frontDeskIds.length)];

      const payDate = new Date(start);
      payDate.setHours(
        10 + Math.floor(Math.random() * 8),
        Math.floor(Math.random() * 60),
        Math.floor(Math.random() * 60)
      );

      payments.push({
        id: payId,
        memberId,
        subscriptionId: subId,
        amount: pkg.price,
        type,
        method,
        splits: [{ method, amount: pkg.price }],
        discount: Math.random() < 0.25 ? Math.round((pkg.price * 0.1) / 100) * 100 : 0,
        bankTransferImage: method === "Bank Transfer" ? RECEIPT_PLACEHOLDER : null,
        datetime: payDate.toISOString(),
        recordedBy: fdId,
      });

      subscriptions.push({
        id: subId,
        memberId,
        type,
        instructorId: coach.id,
        packageName: pkg.name,
        totalSessions: pkg.sessions,
        sessionsRemaining,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        paymentId: payId,
        lastDeductionByCoach: {}, // map coachId -> ISO timestamp
      });

      for (let a = 0; a < sessionsUsed; a++) {
        const attDate = new Date(start);
        attDate.setDate(
          attDate.getDate() + Math.floor(Math.random() * Math.max(1, daysBetween(start, end)))
        );
        attDate.setHours(
          8 + Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 60),
          Math.floor(Math.random() * 60)
        );
        attendance.push({
          id: uid(),
          memberId,
          subscriptionId: subId,
          datetime: attDate.toISOString(),
          deductedBy: type === "Class" ? fdId : coach.id,
        });
      }
    }
  });

  return { members, subscriptions, payments, attendance };
}

const SEED = generateSeed();

// ============================================================================
// INITIAL STATE — exported and used by the reducer
// ============================================================================
export const initialState = {
  coaches: seedCoaches,
  staff: seedStaff,
  members: SEED.members,
  subscriptions: SEED.subscriptions,
  payments: SEED.payments,
  attendance: SEED.attendance,
  packages: [
    ...PACKAGES.PT.map((p, i) => ({ id: `pkg-pt-${i + 1}`, type: "PT", ...p })),
    ...PACKAGES.Class.map((p, i) => ({ id: `pkg-cl-${i + 1}`, type: "Class", ...p })),
    ...PACKAGES.Nutrition.map((p, i) => ({ id: `pkg-nu-${i + 1}`, type: "Nutrition", ...p })),
  ],
};
