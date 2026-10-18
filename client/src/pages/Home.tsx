import { Suspense } from "react";
import HeroVisual from "../components/HeroVisual";
import PublicPlans from "../components/PublicPlans";
import { Link } from "react-router";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";

const HeroCanvas = HeroVisual;

const services = [
  {
    title: "Web Development",
    desc: "Fast, scalable and responsive websites built around your business.",
    color: "#4285F4",
    icon: "◈",
  },
  {
    title: "Web Applications",
    desc: "Custom platforms, dashboards, SaaS products and internal systems.",
    color: "#EA4335",
    icon: "⬡",
  },
  {
    title: "Mobile Applications",
    desc: "Modern cross-platform mobile applications for Android and iOS.",
    color: "#FBBC05",
    icon: "◉",
  },
  {
    title: "UI / UX Design",
    desc: "Interfaces designed around usability, clarity and conversion.",
    color: "#34A853",
    icon: "◈",
  },
  {
    title: "Backend & APIs",
    desc: "Reliable APIs, databases and business logic designed for scale.",
    color: "#4285F4",
    icon: "⬡",
  },
  {
    title: "Infrastructure & Deployment",
    desc: "Cloud infrastructure, Docker, deployment pipelines and production.",
    color: "#EA4335",
    icon: "◉",
  },
  {
    title: "Technical Support",
    desc: "Long-term maintenance, improvements and technical assistance after launch.",
    color: "#FBBC05",
    icon: "◈",
  },
];

const projects = [
  {
    title: "Crestview Analytics",
    client: "Crestview Capital",
    category: "Web Application",
    desc: "Real-time financial analytics dashboard with live data streams, custom charting, and team collaboration tools.",
    tags: ["React", "Node.js", "PostgreSQL", "WebSockets"],
    color: "#4285F4",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop&auto=format",
  },
  {
    title: "Ember Commerce",
    client: "Ember Retail Group",
    category: "E-commerce Platform",
    desc: "High-performance headless commerce platform handling thousands of daily transactions with a custom CMS.",
    tags: ["React", "Catalog", "CMS", "Cloud"],
    color: "#EA4335",
    img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=500&fit=crop&auto=format",
  },
  {
    title: "Northline Mobile",
    client: "Northline Logistics",
    category: "Mobile Application",
    desc: "Driver coordination and fleet tracking app for iOS and Android with offline support and route optimization.",
    tags: ["React Native", "Maps API", "Firebase", "GraphQL"],
    color: "#34A853",
    img: "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=800&h=500&fit=crop&auto=format",
  },
];

const process = [
  {
    num: "01",
    title: "Discovery",
    desc: "Understand the business, requirements and project goals.",
  },
  {
    num: "02",
    title: "Planning",
    desc: "Define architecture, scope, milestones and technical strategy.",
  },
  {
    num: "03",
    title: "Design",
    desc: "Create the user experience, interface and visual language.",
  },
  {
    num: "04",
    title: "Development",
    desc: "Build the product using maintainable and scalable technologies.",
  },
  {
    num: "05",
    title: "Quality Assurance",
    desc: "Test functionality, responsiveness, performance and edge cases.",
  },
  {
    num: "06",
    title: "Deployment",
    desc: "Deploy the final product to its production infrastructure.",
  },
  {
    num: "07",
    title: "Support",
    desc: "Continue improving and maintaining the product after launch.",
  },
];

const supportItems = [
  "Bug fixes",
  "Technical support",
  "Feature adjustments",
  "Developer consultation",
  "Debugging",
  "Configuration",
  "Meetings",
  "Infrastructure assistance",
];

function ServiceCard({
  service,
  index,
}: {
  service: (typeof services)[0];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.5 }}
      whileHover={{ y: -4, scale: 1.015 }}
      className="relative p-6 rounded-2xl cursor-default group"
      style={{
        background: "rgba(19,19,24,0.8)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow: `0 0 40px ${service.color}20, inset 0 0 40px ${service.color}08`,
        }}
      />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-lg"
        style={{ background: `${service.color}18`, color: service.color }}
      >
        {service.icon}
      </div>
      <h3
        className="text-white font-semibold mb-2 text-[15px]"
        style={{ fontFamily: "Manrope" }}
      >
        {service.title}
      </h3>
      <p className="text-[#6b7280] text-sm leading-relaxed">{service.desc}</p>
      <div
        className="absolute bottom-0 left-6 right-6 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(90deg, transparent, ${service.color}60, transparent)`,
        }}
      />
    </motion.div>
  );
}

export default function Home() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "#08080c", fontFamily: "Inter, sans-serif" }}
    >
      <Navbar />

      {/* HERO */}
      <section
        id="home"
        className="relative min-h-screen flex items-center overflow-hidden"
      >
        {/* 3D Canvas */}
        <Suspense fallback={<div className="absolute inset-0 bg-[#08080c]" />}>
          <div className="absolute inset-0 right-0 md:left-1/3 pointer-events-none">
            <HeroCanvas />
          </div>
        </Suspense>

        {/* Gradient overlays */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-0 top-0 bottom-0 w-2/3 bg-gradient-to-r from-[#08080c] via-[#08080c]/90 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#08080c] to-transparent" />
        </div>

        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-[0.06]"
            style={{ background: "#4285F4", filter: "blur(80px)" }}
          />
          <div
            className="absolute bottom-1/3 right-1/3 w-64 h-64 rounded-full opacity-[0.05]"
            style={{ background: "#EA4335", filter: "blur(60px)" }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-40">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-xs font-medium text-[#9898a8]"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#34A853] animate-pulse" />
              Available for new projects
            </div>

            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.08] tracking-tight mb-6"
              style={{ fontFamily: "Manrope" }}
            >
              We build digital{" "}
              <span className="text-gradient-brand">experiences</span> that move
              businesses forward.
            </h1>

            <p className="text-[#9898a8] text-lg leading-relaxed mb-10 max-w-xl">
              Websites, applications and custom software engineered with
              thoughtful design, reliable technology and long-term support.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <button
                onClick={() =>
                  document
                    .getElementById("contact")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="px-6 py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #4285F4, #34A853)",
                  fontFamily: "Manrope",
                }}
              >
                Start a Project
              </button>
              <button
                onClick={() =>
                  document
                    .getElementById("work")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="px-6 py-3.5 rounded-xl font-semibold text-sm text-[#e8e8f0] transition-all duration-200 hover:bg-white/10"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontFamily: "Manrope",
                }}
              >
                Explore Our Work
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs text-[#6b7280] tracking-widest uppercase">
              {["Design", "Development", "Deployment", "Support"].map(
                (item, i) => (
                  <span key={item} className="flex items-center gap-4">
                    {item}
                    {i < 3 && <span className="text-[#2a2a35]">•</span>}
                  </span>
                ),
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-32 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs uppercase tracking-widest text-[#6b7280] mb-4">
            What we do
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight"
            style={{ fontFamily: "Manrope" }}
          >
            From idea to production.
          </h2>
          <p className="text-[#6b7280] text-lg max-w-xl mb-16">
            End-to-end digital product development — from the first sketch to a
            deployed, supported, and evolving product.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s, i) => (
            <ServiceCard key={s.title} service={s} index={i} />
          ))}
        </div>
      </section>

      {/* WORK */}
      <section id="work" className="py-32 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs uppercase tracking-widest text-[#6b7280] mb-4">
            Portfolio
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight"
            style={{ fontFamily: "Manrope" }}
          >
            Concept explorations
          </h2>
          <p className="text-[#6b7280] text-lg max-w-xl mb-16">
            Illustrative concepts with fictional clients, showing the kinds of
            products we can build. Published client case studies will be added
            with permission.
          </p>
        </motion.div>

        <div className="space-y-8">
          {projects.map((project, i) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className={`grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden group cursor-pointer ${i % 2 === 1 ? "" : ""}`}
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div
                className={`relative overflow-hidden ${i % 2 === 1 ? "md:order-2" : ""}`}
                style={{ minHeight: "280px" }}
              >
                <img
                  loading="lazy"
                  src={project.img}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ minHeight: "280px" }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#08080c]/60 to-transparent pointer-events-none" />
              </div>

              <div
                className={`p-10 flex flex-col justify-between ${i % 2 === 1 ? "md:order-1" : ""}`}
                style={{ background: "rgba(13,13,18,0.95)" }}
              >
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xs uppercase tracking-widest text-[#6b7280]">
                      {project.client}
                    </span>
                    <span className="text-[#2a2a35]">·</span>
                    <span
                      className="text-xs uppercase tracking-widest"
                      style={{ color: project.color }}
                    >
                      {project.category}
                    </span>
                  </div>
                  <h3
                    className="text-3xl font-bold text-white mb-4 tracking-tight"
                    style={{ fontFamily: "Manrope" }}
                  >
                    {project.title}
                  </h3>
                  <p className="text-[#6b7280] leading-relaxed mb-6">
                    {project.desc}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-xs rounded-lg text-[#9898a8]"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() =>
                    document
                      .getElementById("contact")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="mt-8 self-start px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-80 hover:-translate-y-0.5"
                  style={{
                    background: `${project.color}20`,
                    border: `1px solid ${project.color}40`,
                    color: project.color,
                    fontFamily: "Manrope",
                  }}
                >
                  Discuss a similar project →
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PROCESS */}
      <section id="process" className="py-32 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs uppercase tracking-widest text-[#6b7280] mb-4">
            Methodology
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-16 tracking-tight"
            style={{ fontFamily: "Manrope" }}
          >
            How we build.
          </h2>
        </motion.div>

        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-[19px] top-0 bottom-0 w-[1px]"
            style={{
              background:
                "linear-gradient(180deg, transparent, rgba(255,255,255,0.08) 15%, rgba(255,255,255,0.08) 85%, transparent)",
            }}
          />

          <div className="space-y-0">
            {process.map((step, i) => {
              const stepColors = [
                "#4285F4",
                "#EA4335",
                "#FBBC05",
                "#34A853",
                "#4285F4",
                "#EA4335",
                "#34A853",
              ];
              const c = stepColors[i];
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="relative flex gap-10 pb-12 group cursor-default"
                >
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 group-hover:scale-110"
                      style={{
                        background: `${c}18`,
                        border: `1px solid ${c}40`,
                        color: c,
                        fontFamily: "Manrope",
                      }}
                    >
                      {step.num}
                    </div>
                  </div>
                  <div className="pt-2">
                    <h3
                      className="text-white font-semibold mb-1.5 text-[15px]"
                      style={{ fontFamily: "Manrope" }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-[#6b7280] text-sm leading-relaxed max-w-xl">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SUPPORT */}
      <section id="support" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div
            className="relative rounded-3xl overflow-hidden p-12 md:p-20"
            style={{
              background: "rgba(13,13,18,0.8)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {/* Ambient glow */}
            <div
              className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
              style={{
                background: "#4285F4",
                opacity: 0.04,
                filter: "blur(80px)",
                transform: "translate(30%, -30%)",
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none"
              style={{
                background: "#34A853",
                opacity: 0.04,
                filter: "blur(60px)",
                transform: "translate(-30%, 30%)",
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-xs uppercase tracking-widest text-[#6b7280] mb-4">
                After launch
              </p>
              <h2
                className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight max-w-2xl"
                style={{ fontFamily: "Manrope" }}
              >
                Development doesn't end at launch.
              </h2>
              <p className="text-[#9898a8] text-lg leading-relaxed max-w-2xl mb-10">
                Pixelerion clients can subscribe to support plans that provide
                dedicated development hours for maintenance, improvements,
                technical assistance and consulting.
              </p>

              <PublicPlans />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
                {supportItems.map((item, i) => {
                  const dotColors = [
                    "#4285F4",
                    "#EA4335",
                    "#FBBC05",
                    "#34A853",
                  ];
                  return (
                    <div
                      key={item}
                      className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm text-[#9898a8]"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: dotColors[i % 4] }}
                      />
                      {item}
                    </div>
                  );
                })}
              </div>

              <Link
                to="/portal/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #4285F4, #34A853)",
                  fontFamily: "Manrope",
                }}
              >
                Access Customer Portal
                <span>→</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-32 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs uppercase tracking-widest text-[#6b7280] mb-4">
              Get in touch
            </p>
            <h2
              className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight"
              style={{ fontFamily: "Manrope" }}
            >
              Ready to start
              <br />a project?
            </h2>
            <p className="text-[#9898a8] text-lg mb-10">
              Tell us about your idea. We will respond within one business day.
            </p>
            <a
              href="mailto:hello@pixelerion.com"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #4285F4, #34A853)",
                fontFamily: "Manrope",
                fontSize: "15px",
              }}
            >
              hello@pixelerion.com
            </a>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="border-t py-10 px-6"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span
            className="text-sm text-[#4b4b60]"
            style={{ fontFamily: "Manrope" }}
          >
            © 2024 Pixelerion. All rights reserved.
          </span>
          <div className="flex items-center gap-1">
            {["#4285F4", "#EA4335", "#FBBC05", "#34A853"].map((c) => (
              <div
                key={c}
                className="w-2 h-2 rounded-full"
                style={{ background: c, opacity: 0.5 }}
              />
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
