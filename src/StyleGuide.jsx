import { useState } from "react";
import { Search, Plus, Trash2, Save, Users, DollarSign, FileText } from "lucide-react";
import { Button, Card, Badge, Input, Select, Modal, Tabs, Table, Form } from "./components/ui";

// ─── Live, visual reference for the Fisheye Ops design system ─────────────
// "Refined Editorial Enterprise" — the approved direction from the Fisheye
// Ops Design System canvas. Not part of the app's real navigation --
// reachable directly at /style-guide while this is being reviewed. Nothing
// here reads or writes real data, and nothing on any EXISTING screen has
// been migrated to this yet -- see DESIGN_SYSTEM.md.

function Section({ title, children }) {
  return (
    <section className="mb-12">
      <h2 className="font-serif text-lg font-bold text-stone-900 mb-1">{title}</h2>
      <div className="h-px bg-stone-200 mb-5" />
      {children}
    </section>
  );
}

function Swatch({ name, note, className }) {
  return (
    <div className="flex items-center gap-3">
      <div className={["h-10 w-10 rounded-md border border-stone-200 shrink-0", className].join(" ")} />
      <div className="text-xs leading-tight font-sans">
        <div className="font-semibold text-stone-800">{name}</div>
        <div className="text-stone-400 font-mono">{note}</div>
      </div>
    </div>
  );
}

export default function StyleGuide() {
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState("overview");
  const [inputVal, setInputVal] = useState("");

  return (
    <div className="min-h-screen bg-stone-50 p-8 font-sans" dir="ltr">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <h1 className="font-serif text-3xl font-bold text-stone-900">Fisheye Ops — Design System</h1>
          <p className="text-sm text-stone-600 mt-1.5 max-w-2xl">
            "Refined Editorial Enterprise" — a warm operations desk instead of another cold SaaS dashboard.
            Crimson and Navy are the only two fixed brand colors; everything else here is new. Internal review
            page — not linked from the app's navigation, and no existing screen has adopted this yet.
          </p>
        </header>

        <Section title="Color — brand (fixed, never changes)">
          <div className="flex flex-wrap gap-6">
            <Swatch name="primary" note="#A02843 — Fisheye Crimson" className="bg-primary" />
            <Swatch name="primary-dark" note="#00293A — Fisheye Navy" className="bg-primary-dark" />
          </div>
        </Section>

        <Section title="Color — warm neutral (new — replaces cold Tailwind gray)">
          <div className="flex flex-wrap gap-6">
            <Swatch name="stone-50" note="page background" className="bg-stone-50" />
            <Swatch name="white" note="card / raised surface" className="bg-white" />
            <Swatch name="stone-100" note="subtle fill / hover" className="bg-stone-100" />
            <Swatch name="stone-200" note="border" className="bg-stone-200" />
            <Swatch name="stone-400" note="faint text" className="bg-stone-400" />
            <Swatch name="stone-600" note="secondary text" className="bg-stone-600" />
            <Swatch name="stone-900" note="primary text (ink)" className="bg-stone-900" />
          </div>
        </Section>

        <Section title="Color — status (refined, accessible, never color-alone)">
          <div className="flex flex-wrap gap-2">
            <Badge color="success" dot>Healthy</Badge>
            <Badge color="warning" dot>At risk</Badge>
            <Badge color="error" dot>Critical</Badge>
            <Badge color="info" dot>Info</Badge>
          </div>
          <p className="text-xs text-stone-400 mt-3 max-w-lg">
            Error is a warm terracotta, deliberately shifted away from the crimson brand hue so a danger
            state and a brand accent are never confused on screen.
          </p>
        </Section>

        <Section title="Typography">
          <div className="space-y-1.5 mb-6">
            <div className="text-[11px] text-stone-400 font-mono">Piazzolla — page titles, section headers, brand moments only</div>
            <p className="font-serif text-3xl font-bold text-stone-900">Client health, at a glance</p>
            <p className="font-serif italic text-lg text-stone-600">Sela — 509 employees, 3 open items</p>
          </div>
          <div className="space-y-2 mb-6">
            <div className="text-[11px] text-stone-400 font-mono">Hanken Grotesk — everything else: labels, body, data, buttons</div>
            <p className="text-lg font-bold text-stone-900">Section heading / 18px bold</p>
            <p className="text-sm font-semibold text-stone-800">Card title / 14px semibold</p>
            <p className="text-sm text-stone-600">Body text at 14px — the ERP-appropriate density for dense screens.</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Meta label / 12px uppercase</p>
          </div>
          <div className="space-y-1.5">
            <div className="text-[11px] text-stone-400 font-mono">IBM Plex Mono — every numeric value, tabular so columns align</div>
            <p className="font-mono text-xl font-semibold text-stone-900 tabular-nums">42,500.00 SAR</p>
          </div>
        </Section>

        <Section title="Button">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger" icon={Trash2}>Delete</Button>
            <Button variant="success" icon={Save}>Save</Button>
            <Button variant="primary" loading>Saving…</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" icon={Plus}>Small</Button>
            <Button size="md" icon={Plus}>Medium</Button>
            <Button size="lg" icon={Plus}>Large</Button>
          </div>
        </Section>

        <Section title="Badge">
          <div className="flex flex-wrap gap-2">
            <Badge color="stone">Draft</Badge>
            <Badge color="success" dot>Healthy</Badge>
            <Badge color="warning" dot>At Risk</Badge>
            <Badge color="error" dot>Critical</Badge>
            <Badge color="info">Info</Badge>
            <Badge color="primary" icon={Users}>24 employees</Badge>
          </div>
        </Section>

        <Section title="Input / Select / Form">
          <div className="max-w-md">
            <Form.Row>
              <Form.Field>
                <Form.Label required>Client name</Form.Label>
                <Input placeholder="e.g. Sela" icon={Search} value={inputVal} onChange={e => setInputVal(e.target.value)} />
                <Form.HelperText>Must match the name used in Fisheye Ops exactly.</Form.HelperText>
              </Form.Field>
              <Form.Field>
                <Form.Label>Status</Form.Label>
                <Select options={[{value:"active",label:"Active"},{value:"archived",label:"Archived"}]} />
              </Form.Field>
            </Form.Row>
            <Form.Field className="mt-4">
              <Form.Label required>Required field, empty</Form.Label>
              <Input error placeholder="This field has an error" />
              <Form.ErrorText>This field is required.</Form.ErrorText>
            </Form.Field>
          </div>
        </Section>

        <Section title="Card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card header={<h3 className="font-semibold text-sm text-stone-800">Basic card</h3>}>
              <p className="text-sm text-stone-600">Body content goes here.</p>
            </Card>
            <Card
              interactive
              header={<h3 className="font-semibold text-sm text-stone-800">Interactive card</h3>}
              footer={<Button size="sm" variant="ghost" fullWidth>View details</Button>}
            >
              <p className="text-sm text-stone-600">Hover to see the lift + shadow.</p>
            </Card>
          </div>
        </Section>

        <Section title="Tabs">
          <Tabs
            tabs={[
              { key: "overview", label: "Overview", icon: FileText },
              { key: "employees", label: "Employees", icon: Users },
              { key: "billing", label: "Billing", icon: DollarSign },
            ]}
            active={tab}
            onChange={setTab}
          />
          <p className="text-sm text-stone-500 mt-3">Active tab: <span className="font-semibold text-stone-800">{tab}</span> — the underline slides to follow it.</p>
        </Section>

        <Section title="Table">
          <Table.Root>
            <Table.Head>
              <tr>
                <Table.Th>Employee</Table.Th>
                <Table.Th>Project</Table.Th>
                <Table.Th align="right">Salary</Table.Th>
              </tr>
            </Table.Head>
            <tbody>
              {[["Ahmed Al-Saleh","SILQFI","8,500.00"],["Layla Al-Rashid","Batch A","6,200.00"]].map(([n,p,s]) => (
                <tr key={n} className="[@media(hover:hover)]:hover:bg-stone-50">
                  <Table.Td>{n}</Table.Td>
                  <Table.Td>{p}</Table.Td>
                  <Table.Td align="right" numeric>{s}</Table.Td>
                </tr>
              ))}
            </tbody>
          </Table.Root>
        </Section>

        <Section title="Modal">
          <Button onClick={() => setModalOpen(true)}>Open modal</Button>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Example modal"
            footer={<>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setModalOpen(false)}>Confirm</Button>
            </>}
          >
            <p className="text-sm text-stone-600">This is the modal body. Escape key, backdrop click, and the × button all close it.</p>
          </Modal>
        </Section>
      </div>
    </div>
  );
}
