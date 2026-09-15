import { useState } from "react";
import { Search, Plus, Trash2, Save, Users, DollarSign, FileText } from "lucide-react";
import { Button, Card, Badge, Input, Select, Modal, Tabs, Table, Form } from "./components/ui";

// ─── Live, visual reference for the Fisheye Ops design system ─────────────
// Not part of the app's real navigation -- reachable directly at /style-guide
// while this is being reviewed. Nothing here reads or writes real data.
// See DESIGN_SYSTEM.md for the written reference (tokens, usage snippets,
// migration plan).

function Section({ title, children }) {
  return (
    <section className="mb-12">
      <h2 className="text-lg font-bold text-gray-900 mb-1 font-sans">{title}</h2>
      <div className="h-px bg-gray-200 mb-5" />
      {children}
    </section>
  );
}

function Swatch({ name, varName, hex }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-md border border-gray-200 shrink-0" style={{ background: hex }} />
      <div className="text-xs leading-tight">
        <div className="font-semibold text-gray-800">{name}</div>
        <div className="text-gray-400 font-mono">{varName}</div>
      </div>
    </div>
  );
}

const COLOR_GROUPS = [
  { label: "Primary — Fisheye Crimson", items: [
    { name: "primary", varName: "--brand · #A02843", hex: "var(--brand)" },
    { name: "primary-dark", varName: "--brand-dark · #00293A", hex: "var(--brand-dark)" },
  ]},
  { label: "Gray (aligned scale — see DESIGN_SYSTEM.md)", items: [50,100,200,300,400,500,600,700,800,900].map(n => ({
    name: `gray-${n}`, varName: `--gray-${n}`, hex: `var(--gray-${n})`,
  }))},
  { label: "Success", items: [100,600,800].map(n => ({ name: `success-${n}`, varName: `success.${n}`, hex: ({100:"#dcfce7",600:"#16a34a",800:"#166534"})[n] }))},
  { label: "Warning", items: [100,600,800].map(n => ({ name: `warning-${n}`, varName: `warning.${n}`, hex: ({100:"#fef9c3",600:"#d97706",800:"#92400e"})[n] }))},
  { label: "Error", items: [100,600,800].map(n => ({ name: `error-${n}`, varName: `error.${n}`, hex: ({100:"#fee2e2",600:"#dc2626",800:"#991b1b"})[n] }))},
  { label: "Info", items: [100,600,800].map(n => ({ name: `info-${n}`, varName: `info.${n}`, hex: ({100:"#dbeafe",600:"#2563eb",800:"#1e40af"})[n] }))},
];

export default function StyleGuide() {
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState("overview");
  const [inputVal, setInputVal] = useState("");

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans" dir="ltr">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <h1 className="text-2xl font-extrabold text-gray-900">Fisheye Ops — Design System</h1>
          <p className="text-sm text-gray-500 mt-1">
            Live reference for design tokens and the reusable component library. Internal review page — not linked from the app's navigation.
          </p>
        </header>

        <Section title="Colors">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-6">
            {COLOR_GROUPS.map(g => (
              <div key={g.label} className="col-span-full">
                <div className="text-xs font-semibold text-gray-500 mb-2">{g.label}</div>
                <div className="flex flex-wrap gap-4">
                  {g.items.map(it => <Swatch key={it.name} {...it} />)}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typography">
          <div className="space-y-2">
            <p className="text-2xl font-extrabold text-gray-900">Heading / 24px extrabold</p>
            <p className="text-lg font-bold text-gray-900">Section title / 18px bold</p>
            <p className="text-sm font-semibold text-gray-800">Label / 14px semibold</p>
            <p className="text-sm text-gray-700">Body text / 14px regular — Plus Jakarta Sans</p>
            <p className="text-xs text-gray-500">Meta / caption / 12px</p>
            <p className="font-mono text-sm text-gray-700">42,500.00 SAR — numeric values use IBM Plex Mono</p>
          </div>
        </Section>

        <Section title="Spacing (Tailwind default 4px scale)">
          <div className="flex items-end gap-3">
            {[1,2,3,4,6,8,12,16].map(n => (
              <div key={n} className="text-center">
                <div className="bg-primary/70 rounded-sm" style={{ width: n * 4, height: 24 }} />
                <div className="text-[10px] text-gray-400 mt-1">{n} = {n*4}px</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Shadows & Radius">
          {/* Literal class names on purpose -- Tailwind's build-time scanner
             greps this file's raw text for class-name-shaped strings, so a
             dynamically-built `shadow-${s}` string would never actually be
             emitted in the compiled CSS. */}
          <div className="flex flex-wrap gap-6">
            <div className="h-16 w-16 bg-white rounded-md flex items-center justify-center text-[10px] text-gray-400 shadow-xs">xs</div>
            <div className="h-16 w-16 bg-white rounded-md flex items-center justify-center text-[10px] text-gray-400 shadow-sm">sm</div>
            <div className="h-16 w-16 bg-white rounded-md flex items-center justify-center text-[10px] text-gray-400 shadow-md">md</div>
            <div className="h-16 w-16 bg-white rounded-md flex items-center justify-center text-[10px] text-gray-400 shadow-lg">lg</div>
            <div className="h-16 w-16 bg-white rounded-md flex items-center justify-center text-[10px] text-gray-400 shadow-xl">xl</div>
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
            <Badge color="gray">Draft</Badge>
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
            <Card header={<h3 className="font-semibold text-sm text-gray-800">Basic card</h3>}>
              <p className="text-sm text-gray-600">Body content goes here.</p>
            </Card>
            <Card
              interactive
              header={<h3 className="font-semibold text-sm text-gray-800">Interactive card</h3>}
              footer={<Button size="sm" variant="ghost" fullWidth>View details</Button>}
            >
              <p className="text-sm text-gray-600">Hover to see the lift + shadow.</p>
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
          <p className="text-sm text-gray-500 mt-3">Active tab: <span className="font-semibold text-gray-800">{tab}</span></p>
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
                <tr key={n}>
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
            <p className="text-sm text-gray-600">This is the modal body. Escape key, backdrop click, and the × button all close it.</p>
          </Modal>
        </Section>
      </div>
    </div>
  );
}
