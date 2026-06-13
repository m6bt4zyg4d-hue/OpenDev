import {
  Activity,
  Apple,
  Bot,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  Cloud,
  Code2,
  CreditCard,
  Database,
  GitBranch,
  Globe2,
  KanbanSquare,
  Layers3,
  LockKeyhole,
  MonitorSmartphone,
  Rocket,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  TerminalSquare,
  TestTube2,
  Users,
  Wand2
} from 'lucide-react';

const dashboardItems = [
  { title: 'Recent Projects', value: '24 active builds', icon: Layers3 },
  { title: 'Project Library', value: 'Web, mobile, APIs, SaaS', icon: Boxes },
  { title: 'AI Assistant', value: 'Multi-agent engineering copilot', icon: Bot },
  { title: 'Templates Marketplace', value: 'Production starters', icon: Store },
  { title: 'Team Workspaces', value: 'Realtime collaboration', icon: Users },
  { title: 'Hosting Center', value: 'Edge, databases, APIs', icon: Cloud },
  { title: 'Deployment Center', value: 'One-click pipelines', icon: Rocket },
  { title: 'Billing Center', value: 'Plans and usage', icon: CreditCard },
  { title: 'Account Settings', value: 'Security and preferences', icon: Settings }
];

const projectTypes = ['Website', 'Web App', 'iOS App', 'Android App', 'API', 'SaaS Platform', 'AI Application', 'Game'];
const wizardFields = ['Project Name', 'Description', 'Project Type', 'Features Required', 'Programming Language', 'Database Type', 'Deployment Target'];

const agents = [
  ['Frontend Engineer', 'Builds UI, layouts, reusable components, and responsive experiences.', Code2],
  ['Backend Engineer', 'Creates APIs, databases, authentication, queues, and service logic.', Database],
  ['Mobile Engineer', 'Builds iOS and Android apps with native-quality previews.', Smartphone],
  ['UI/UX Designer', 'Generates wireframes, design systems, flows, and prototypes.', Wand2],
  ['QA Engineer', 'Runs tests, finds bugs, and manages regression suites.', TestTube2],
  ['Security Engineer', 'Scans for vulnerabilities, secrets, policy drift, and threats.', ShieldCheck],
  ['DevOps Engineer', 'Handles hosting, deployments, observability, scaling, and rollbacks.', Rocket]
] as const;

const studioPanels = [
  ['Files', 'Assets', 'Components', 'APIs', 'Databases', 'AI Agents', 'Git', 'Deployments'],
  ['Code Editor', 'Visual Designer', 'Drag and Drop Builder', 'Live Preview', 'Mobile Preview', 'Web Preview'],
  ['Terminal', 'Logs', 'Build Output', 'AI Suggestions', 'Error Console']
];

const builderSteps = [
  'Creates requirements',
  'Creates architecture',
  'Creates database schema',
  'Creates frontend and backend',
  'Creates API routes and authentication',
  'Creates deployment setup and testing suite'
];

const milestones = [
  ['Discovery', 'Requirements, feature scope, data model'],
  ['Architecture', 'Services, AI agents, infrastructure plan'],
  ['Build', 'Frontend, backend, mobile, APIs, tests'],
  ['Launch', 'Security review, deployment, app store package']
];

const securityFeatures = ['Data Encryption', 'Secure Authentication', 'Role-Based Access Control', 'Audit Logs', 'API Key Management', 'Backups', 'Threat Detection'];
const hostingFeatures = ['One Click Deployment', 'SSL Certificates', 'Domain Management', 'Analytics', 'Monitoring', 'Auto Scaling', 'CDN Support'];

export default function OpenDevHomePage() {
  return (
    <main className="opendev-shell">
      <section className="opendev-hero">
        <nav className="opendev-topbar" aria-label="OpenDev navigation">
          <div className="opendev-brand"><Sparkles size={22} /> OpenDev</div>
          <div className="opendev-navlinks"><a href="#studio">Studio</a><a href="#agents">AI Agents</a><a href="#hosting">Hosting</a><a href="#billing">Billing</a></div>
          <a className="opendev-cta" href="#wizard">Start building</a>
        </nav>
        <div className="opendev-hero-grid">
          <div>
            <p className="opendev-kicker">AI-powered software development platform</p>
            <h1>Build, host, deploy, and publish every kind of software from one intelligent workspace.</h1>
            <p className="opendev-lede">OpenDev combines Xcode, VS Code, GitHub, Replit, Figma, and a team of AI software engineers into a production-ready SaaS command center.</p>
            <div className="opendev-actions"><a className="opendev-primary" href="#builder"><BrainCircuit size={18} /> Build with AI</a><a className="opendev-secondary" href="#dashboard"><MonitorSmartphone size={18} /> View dashboard</a></div>
          </div>
          <div className="opendev-command-card">
            <div className="opendev-window-bar"><span /><span /><span /></div>
            <code>Build a food delivery app with auth, maps, payments, admin analytics, iOS, Android, and production deployment.</code>
            <div className="opendev-progress"><span style={{ width: '72%' }} /></div>
            <p>AI architecture complete · schema generated · frontend in progress</p>
          </div>
        </div>
      </section>

      <section id="dashboard" className="opendev-section">
        <div className="opendev-section-heading"><p>MAIN DASHBOARD</p><h2>A premium dark command center for your entire software portfolio.</h2></div>
        <div className="opendev-dashboard-grid">{dashboardItems.map(({ title, value, icon: Icon }) => <article key={title} className="opendev-card"><Icon size={22} /><h3>{title}</h3><p>{value}</p></article>)}</div>
      </section>

      <section id="wizard" className="opendev-section opendev-two-col">
        <div><p className="opendev-kicker">PROJECT CREATION</p><h2>Launch anything: websites, apps, APIs, SaaS, AI products, and games.</h2><div className="opendev-chip-grid">{projectTypes.map((type) => <span key={type}>{type}</span>)}</div></div>
        <form className="opendev-wizard">{wizardFields.map((field) => <label key={field}>{field}<input placeholder={`Enter ${field.toLowerCase()}`} /></label>)}<button type="button">Generate project plan</button></form>
      </section>

      <section id="studio" className="opendev-section">
        <div className="opendev-section-heading"><p>OPENDEV STUDIO</p><h2>A professional AI IDE with code, visual design, previews, terminal, logs, and deployments.</h2></div>
        <div className="opendev-studio"><aside>{studioPanels[0].map((item) => <span key={item}>{item}</span>)}</aside><div className="opendev-editor"><div className="opendev-tabs">{studioPanels[1].map((item) => <b key={item}>{item}</b>)}</div><pre>{`export async function deploy(project) {\n  await ai.review(project);\n  await tests.run();\n  return hosting.publish(project);\n}`}</pre><div className="opendev-preview"><Globe2 /> Live responsive preview</div></div><footer>{studioPanels[2].map((item) => <span key={item}><TerminalSquare size={15} /> {item}</span>)}</footer></div>
      </section>

      <section id="agents" className="opendev-section">
        <div className="opendev-section-heading"><p>AI AGENTS</p><h2>Assign tasks to specialized engineers, designers, QA, security, and DevOps agents.</h2></div>
        <div className="opendev-agent-grid">{agents.map(([name, desc, Icon]) => <article key={name} className="opendev-card"><Icon size={24} /><h3>{name}</h3><p>{desc}</p><button>Assign task</button></article>)}</div>
      </section>

      <section id="builder" className="opendev-section opendev-two-col">
        <div><p className="opendev-kicker">AI APP BUILDER</p><h2>Type “Build a marketplace app” and OpenDev produces a complete delivery plan and codebase.</h2><div className="opendev-prompts"><span>Build a social network.</span><span>Build a fitness tracker.</span><span>Build a SaaS analytics platform.</span></div></div>
        <div className="opendev-checklist">{builderSteps.map((step) => <p key={step}><CheckCircle2 size={18} /> {step}</p>)}</div>
      </section>

      <section className="opendev-section opendev-two-col">
        <div><p className="opendev-kicker">PROJECT TIMELINE</p><h2>AI estimates duration, milestones, roadmap, task board, and development status.</h2><div className="opendev-progress big"><span style={{ width: '46%' }} /></div><p className="opendev-muted">Small: hours-days · Medium: days-weeks · Large: weeks-months · Enterprise: months</p></div>
        <div className="opendev-roadmap">{milestones.map(([name, desc]) => <article key={name}><KanbanSquare size={18} /><b>{name}</b><p>{desc}</p></article>)}</div>
      </section>

      <section id="hosting" className="opendev-section opendev-three-col">
        <article className="opendev-card"><GitBranch /><h3>Version Control</h3><p>Git integration, commit history, branching, rollback, pull requests, and collaboration reviews.</p></article>
        <article className="opendev-card"><Cloud /><h3>Hosting Platform</h3><p>{hostingFeatures.join(' · ')}</p></article>
        <article className="opendev-card"><Apple /><h3>App Store Publishing</h3><p>Icons, screenshots, descriptions, privacy policies, terms, release notes, and Apple App Store / Google Play submission guidance.</p></article>
      </section>

      <section className="opendev-section opendev-two-col">
        <div><p className="opendev-kicker">COLLABORATION & AUTH</p><h2>Shared workspaces, realtime editing, chat, comments, notifications, permissions, email, Google, GitHub, reset, and 2FA.</h2></div>
        <div className="opendev-checklist">{securityFeatures.map((item) => <p key={item}><LockKeyhole size={18} /> {item}</p>)}</div>
      </section>

      <section id="billing" className="opendev-section">
        <div className="opendev-section-heading"><p>BILLING SYSTEM</p><h2>Secure subscriptions with payment processing and platform-compliant in-app purchases where required.</h2></div>
        <div className="opendev-pricing"><article><h3>Free</h3><strong>$0</strong><p>3 active projects · Limited AI usage · Basic hosting</p></article><article className="featured"><h3>Pro Monthly</h3><strong>$10.99/mo</strong><p>Unlimited projects · Advanced AI agents · Premium hosting · Priority build queue</p></article><article><h3>Pro Yearly</h3><strong>$100.99/yr</strong><p>Everything in Pro Monthly · Annual savings</p></article></div>
      </section>

      <section className="opendev-footer"><Activity /> Next.js · React · TypeScript · Tailwind CSS · Node.js · PostgreSQL · Docker · Kubernetes · Multi-Agent AI</section>
    </main>
  );
}
