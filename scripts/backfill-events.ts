import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const db = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function eventExists(
  companyId: string,
  eventType: string,
  createdAt: string
): Promise<boolean> {
  const { data } = await db
    .from("events")
    .select("id")
    .eq("company_id", companyId)
    .eq("event_type", eventType)
    .eq("created_at", createdAt)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function insertEvent(event: {
  company_id: string;
  event_type: string;
  description: string;
  created_at: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
}) {
  const exists = await eventExists(
    event.company_id,
    event.event_type,
    event.created_at
  );
  if (exists) return;

  await db.from("events").insert({
    company_id: event.company_id,
    user_id: event.user_id || null,
    event_type: event.event_type,
    description: event.description,
    metadata: event.metadata || {},
    created_at: event.created_at,
  });
}

async function backfill() {
  console.log("Starting event backfill...");

  const { data: companies } = await db
    .from("companies")
    .select("id, name, created_at")
    .limit(10000);

  if (!companies) {
    console.log("No companies found.");
    return;
  }

  console.log(`Found ${companies.length} companies.`);

  for (const company of companies) {
    await insertEvent({
      company_id: company.id,
      event_type: "signup",
      description: `${company.name} signed up`,
      created_at: company.created_at,
    });

    const { data: firstCO } = await db
      .from("change_orders")
      .select("id, created_at, created_by")
      .eq("company_id", company.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (firstCO) {
      await insertEvent({
        company_id: company.id,
        event_type: "first_change_order",
        description: "First change order created",
        created_at: firstCO.created_at,
        user_id: firstCO.created_by,
      });
    }

    const { data: changeOrders } = await db
      .from("change_orders")
      .select("id, co_number, status, created_at, sent_at, approved_at, declined_at, created_by")
      .eq("company_id", company.id)
      .limit(10000);

    if (changeOrders) {
      for (const co of changeOrders) {
        await insertEvent({
          company_id: company.id,
          event_type: "change_order_created",
          description: `Change order ${co.co_number} created`,
          created_at: co.created_at,
          user_id: co.created_by,
          metadata: { change_order_id: co.id },
        });

        if (co.sent_at) {
          await insertEvent({
            company_id: company.id,
            event_type: "change_order_sent",
            description: `Change order ${co.co_number} sent`,
            created_at: co.sent_at,
            user_id: co.created_by,
            metadata: { change_order_id: co.id },
          });
        }

        if (co.approved_at) {
          await insertEvent({
            company_id: company.id,
            event_type: "change_order_approved",
            description: `Change order ${co.co_number} approved`,
            created_at: co.approved_at,
            metadata: { change_order_id: co.id },
          });
        }

        if (co.declined_at) {
          await insertEvent({
            company_id: company.id,
            event_type: "change_order_rejected",
            description: `Change order ${co.co_number} declined`,
            created_at: co.declined_at,
            metadata: { change_order_id: co.id },
          });
        }
      }
    }
  }

  console.log("Backfill complete.");
}

backfill().catch(console.error);
