import React, { useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  Globe,
  GraduationCap,
  Lock,
  LogOut,
  Mail,
  Menu,
  PlayCircle,
  ShieldCheck,
  Star,
  User,
  X,
} from "lucide-react";

const COURSE = {
  id: "marketing-digital-01",
  title: "Curso de Marketing Digital",
  category: "Marketing",
  price: 10,
  rating: 4.9,
  duration: "12 horas",
  lessons: 28,
  students: 1240,
  description:
    "Aprenda marketing digital do zero com foco em redes sociais, conteúdo, vendas e posicionamento online.",
  modules: [
    "Fundamentos do Marketing Digital",
    "Instagram, TikTok e Conteúdo",
    "Funil de Vendas",
    "Tráfego e Conversão",
    "Estratégia de Crescimento",
  ],
};

const LESSONS = [
  { title: "Boas-vindas ao curso", duration: "08:10" },
  { title: "Fundamentos do marketing digital", duration: "14:24" },
  { title: "Como criar conteúdo que vende", duration: "17:03" },
  { title: "Estratégias de tráfego", duration: "12:48" },
  { title: "Plano de ação final", duration: "09:22" },
];

function App() {
  const [page, setPage] = useState("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showPix, setShowPix] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState("");
  const [pixData, setPixData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });

  const isLoggedIn = !!userData;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          let profile = {
            uid: user.uid,
            email: user.email || "",
            name: user.displayName || "Aluno",
          };

          if (userSnap.exists()) {
            const data = userSnap.data();
            profile = {
              uid: user.uid,
              email: data.email || user.email || "",
              name: data.name || user.displayName || "Aluno",
            };
          }

          const purchasesRef = collection(db, "users", user.uid, "purchases");
          const purchasesSnap = await getDocs(purchasesRef);
          const purchasesList = purchasesSnap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }));

          setUserData(profile);
          setPurchases(purchasesList);
        } else {
          setUserData(null);
          setPurchases([]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const hasCourse = useMemo(() => {
    return purchases.some((item) => item.courseId === COURSE.id);
  }, [purchases]);

  const resetAuthFeedback = () => {
    setAuthError("");
    setAuthSuccess("");
  };

  const handleAuth = async () => {
    resetAuthFeedback();

    if (authMode === "register" && !form.name.trim()) {
      setAuthError("Digite seu nome para criar a conta.");
      return;
    }

    if (!form.email.trim() || !form.password.trim()) {
      setAuthError("Preencha e-mail e senha.");
      return;
    }

    if (!form.email.includes("@")) {
      setAuthError("Digite um e-mail válido.");
      return;
    }

    if (form.password.length < 6) {
      setAuthError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    try {
      if (authMode === "register") {
        const credential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await setDoc(
          doc(db, "users", credential.user.uid),
          {
            name: form.name.trim(),
            email: form.email.trim(),
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
        setAuthSuccess("Conta criada com sucesso.");
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      }

      setShowAuth(false);
      setForm({ name: "", email: "", password: "" });
    } catch (error) {
      const code = error?.code || "";
      if (code.includes("email-already-in-use")) setAuthError("Esse e-mail já está em uso.");
      else if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) setAuthError("E-mail ou senha incorretos.");
      else setAuthError("Não foi possível continuar. Tente novamente.");
    }
  };

  const handleGoogleLogin = async () => {
    resetAuthFeedback();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: user.displayName || "Aluno Google",
          email: user.email || "",
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
      setShowAuth(false);
    } catch (error) {
      setAuthError("Não foi possível entrar com Google.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setPage("home");
  };

  const handleGeneratePix = async () => {
    if (!isLoggedIn) {
      setShowAuth(true);
      return;
    }

    setPixLoading(true);
    setPixError("");
    setPixData(null);

    try {
      const response = await fetch("/api/create-pix", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.details?.error_messages?.[0]?.description || data?.error || "Erro ao gerar PIX");
      }

      setPixData(data);
      setShowPix(true);
    } catch (error) {
      setPixError(error.message || "Não foi possível gerar o PIX.");
    } finally {
      setPixLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!auth.currentUser) {
      setPixError("Você precisa estar logado para concluir.");
      return;
    }

    if (hasCourse) {
      setShowPix(false);
      setPage("dashboard");
      return;
    }

    const purchase = {
      courseId: COURSE.id,
      title: COURSE.title,
      price: COURSE.price,
      category: COURSE.category,
      status: "aguardando_confirmacao",
      paymentMethod: "pix",
      progress: 0,
      createdAt: serverTimestamp(),
      pixCode: pixData?.copiaECola || "",
      pixOrderId: pixData?.pedido || "",
      qrCodeLink: pixData?.qrCodeLink || "",
    };

    try {
      const ref = await addDoc(collection(db, "users", auth.currentUser.uid, "purchases"), purchase);
      setPurchases((prev) => [
        ...prev,
        {
          id: ref.id,
          ...purchase,
        },
      ]);
      setShowPix(false);
      setPage("dashboard");
    } catch (error) {
      setPixError("Não foi possível salvar a compra.");
    }
  };

  const copyPixCode = async () => {
    if (!pixData?.copiaECola) return;
    try {
      await navigator.clipboard.writeText(pixData.copiaECola);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const submitContact = (e) => {
    e.preventDefault();
    alert("Mensagem enviada com sucesso.");
    setContactForm({ name: "", email: "", message: "" });
  };

  const styles = {
    app: {
      minHeight: "100vh",
      background: "radial-gradient(circle at top, rgba(185,28,28,0.18), transparent 25%), #050505",
      color: "#fff",
      fontFamily: "Inter, Arial, sans-serif",
    },
    container: { maxWidth: 1200, margin: "0 auto", padding: "0 20px" },
    header: {
      position: "sticky",
      top: 0,
      zIndex: 50,
      background: "rgba(5,5,5,0.85)",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      backdropFilter: "blur(14px)",
    },
    button: {
      border: 0,
      borderRadius: 14,
      padding: "12px 18px",
      fontWeight: 800,
      cursor: "pointer",
    },
    primary: {
      background: "linear-gradient(135deg,#b91c1c,#ef4444)",
      color: "#fff",
      boxShadow: "0 12px 30px rgba(185,28,28,0.28)",
    },
    ghost: {
      background: "rgba(255,255,255,0.05)",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.10)",
    },
    card: {
      background: "rgba(10,10,10,0.92)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 26,
      overflow: "hidden",
      boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
    },
    input: {
      width: "100%",
      height: 48,
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.04)",
      color: "#fff",
      padding: "0 14px",
      boxSizing: "border-box",
      outline: "none",
    },
    textarea: {
      width: "100%",
      minHeight: 140,
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.04)",
      color: "#fff",
      padding: 14,
      boxSizing: "border-box",
      outline: "none",
      resize: "vertical",
    },
    badge: {
      display: "inline-block",
      padding: "7px 12px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.08)",
      fontSize: 12,
      fontWeight: 700,
    },
  };

  const nav = [
    { label: "Início", page: "home" },
    { label: "Curso", page: "course" },
    { label: "Sobre", page: "about" },
    { label: "Contato", page: "contact" },
  ];

  const responsiveGrid = {
    display: "grid",
    gridTemplateColumns: window.innerWidth < 900 ? "1fr" : "1.1fr 0.9fr",
    gap: 26,
    alignItems: "center",
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={{ ...styles.container, display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 78, gap: 16 }}>
          <button onClick={() => setPage("home")} style={{ background: "none", border: 0, color: "#fff", cursor: "pointer", textAlign: "left" }}>
            <div style={{ fontSize: 28, fontWeight: 900 }}>Nova Midia</div>
            <div style={{ color: "#8b8b8b", fontSize: 12 }}>Curso premium online</div>
          </button>

          <div style={{ display: window.innerWidth < 900 ? "none" : "flex", gap: 22, alignItems: "center" }}>
            {nav.map((item) => (
              <button key={item.label} onClick={() => setPage(item.page)} style={{ background: "none", border: 0, color: "#b3b3b3", cursor: "pointer", fontWeight: 600 }}>
                {item.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {window.innerWidth < 900 ? (
              <button style={{ ...styles.button, ...styles.ghost, padding: 12 }} onClick={() => setMobileOpen((prev) => !prev)}>
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            ) : null}
            <button
              style={{ ...styles.button, ...styles.ghost }}
              onClick={() => (isLoggedIn ? setPage("dashboard") : setShowAuth(true))}
            >
              {authLoading ? "Carregando..." : isLoggedIn ? userData?.name : "Entrar"}
            </button>
          </div>
        </div>
        {mobileOpen ? (
          <div style={{ ...styles.container, paddingBottom: 16 }}>
            <div style={{ ...styles.card, padding: 14, display: "grid", gap: 10 }}>
              {nav.map((item) => (
                <button key={item.label} style={{ ...styles.button, ...styles.ghost, textAlign: "left" }} onClick={() => { setPage(item.page); setMobileOpen(false); }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <main style={styles.container}>
        {page === "home" ? (
          <section style={{ padding: "44px 0 28px" }}>
            <div style={responsiveGrid}>
              <div>
                <div style={{ display: "inline-flex", gap: 8, alignItems: "center", padding: "10px 14px", borderRadius: 999, background: "rgba(185,28,28,0.16)", color: "#fecaca", border: "1px solid rgba(239,68,68,0.22)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  <ShieldCheck size={14} /> plataforma com login e pix
                </div>
                <h1 style={{ fontSize: window.innerWidth < 900 ? 42 : 68, lineHeight: 0.96, margin: "20px 0 0", fontWeight: 950, letterSpacing: -2 }}>
                  Venda seu conhecimento com um
                  <span style={{ display: "block", color: "#ef4444" }}>site bonito e funcional</span>
                </h1>
                <p style={{ color: "#a1a1aa", fontSize: 18, lineHeight: 1.7, maxWidth: 680, marginTop: 20 }}>
                  Plataforma completa com conta real, login com Google, Firebase, geração automática de PIX e painel do aluno. O curso está configurado em R$ 10,00.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 26 }}>
                  <button style={{ ...styles.button, ...styles.primary }} onClick={() => setPage("course")}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      Ver curso <ArrowRight size={16} />
                    </span>
                  </button>
                  <button style={{ ...styles.button, ...styles.ghost }} onClick={() => setPage("about")}>
                    Conhecer empresa
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 900 ? "1fr" : "repeat(3,1fr)", gap: 14, marginTop: 30 }}>
                  {[
                    { label: "Preço", value: "R$ 10" },
                    { label: "Aulas", value: String(COURSE.lessons) },
                    { label: "Avaliação", value: "4.9" },
                  ].map((item) => (
                    <div key={item.label} style={{ ...styles.card, padding: 20 }}>
                      <div style={{ fontSize: 32, fontWeight: 950 }}>{item.value}</div>
                      <div style={{ color: "#8b8b8b", marginTop: 4 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.card}>
                <div style={{ padding: 22, background: "linear-gradient(145deg, rgba(127,29,29,0.36), rgba(0,0,0,1))", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ color: "#a1a1aa", fontSize: 14 }}>Curso em destaque</div>
                  <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{COURSE.title}</div>
                </div>
                <div style={{ display: "grid", gap: 14, padding: 20 }}>
                  {[
                    { icon: GraduationCap, title: "Login real", text: "Cadastro, login com senha e Google pelo Firebase." },
                    { icon: CreditCard, title: "PIX automático", text: "Geração de QR Code e código copia e cola pelo PagBank." },
                    { icon: BookOpen, title: "Painel do aluno", text: "Área com curso comprado e status do pagamento." },
                  ].map((item) => (
                    <div key={item.title} style={{ ...styles.card, padding: 16, borderRadius: 22 }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 42, height: 42, borderRadius: 14, display: "grid", placeItems: "center", background: "rgba(185,28,28,0.16)", color: "#f87171", flexShrink: 0 }}>
                          <item.icon size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800 }}>{item.title}</div>
                          <div style={{ color: "#a1a1aa", marginTop: 6, lineHeight: 1.6 }}>{item.text}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {page === "course" ? (
          <section style={{ padding: "30px 0" }}>
            <div style={{ textAlign: "center", marginBottom: 26 }}>
              <div style={{ display: "inline-block", padding: "8px 14px", borderRadius: 999, background: "rgba(127,29,29,0.18)", color: "#fecaca", border: "1px solid rgba(239,68,68,0.20)", fontSize: 12, fontWeight: 800 }}>curso disponível agora</div>
              <h2 style={{ fontSize: window.innerWidth < 900 ? 34 : 48, margin: "16px 0 0", fontWeight: 950 }}>{COURSE.title}</h2>
              <p style={{ color: "#a1a1aa", maxWidth: 760, margin: "14px auto 0", lineHeight: 1.7 }}>{COURSE.description}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 900 ? "1fr" : "1fr 0.95fr", gap: 22 }}>
              <div style={styles.card}>
                <div style={{ padding: 24 }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
                    <span style={styles.badge}>{COURSE.category}</span>
                    <span style={styles.badge}>{COURSE.duration}</span>
                    <span style={styles.badge}>{COURSE.lessons} aulas</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#f87171" }}>
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={15} fill="currentColor" />)}
                    <span style={{ color: "#d4d4d8", marginLeft: 5 }}>{COURSE.rating}</span>
                  </div>
                  <div style={{ marginTop: 22, fontWeight: 800, fontSize: 20 }}>Módulos do curso</div>
                  <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                    {COURSE.modules.map((module) => (
                      <div key={module} style={{ padding: 14, borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        {module}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <div style={{ padding: 24 }}>
                  <div style={{ color: "#8b8b8b", fontSize: 14 }}>Acesso ao curso</div>
                  <div style={{ fontSize: 46, fontWeight: 950, marginTop: 6 }}>R$ 10</div>
                  <div style={{ color: "#a1a1aa", marginTop: 10, lineHeight: 1.7 }}>
                    Compra via PIX automático. Depois de gerar o pagamento, você recebe o QR Code e o código copia e cola.
                  </div>

                  <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                    {[
                      { icon: Clock3, text: `${COURSE.duration} de conteúdo` },
                      { icon: PlayCircle, text: `${COURSE.lessons} aulas disponíveis` },
                      { icon: Globe, text: "Acesso online" },
                    ].map((item) => (
                      <div key={item.text} style={{ display: "flex", gap: 10, alignItems: "center", padding: 14, borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <item.icon size={18} color="#f87171" />
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>

                  {hasCourse ? (
                    <div style={{ marginTop: 18, padding: 14, borderRadius: 18, background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.22)", color: "#bbf7d0" }}>
                      Você já tem esse curso no seu painel.
                    </div>
                  ) : null}

                  {pixError ? (
                    <div style={{ marginTop: 18, padding: 14, borderRadius: 18, background: "rgba(185,28,28,0.12)", border: "1px solid rgba(239,68,68,0.22)", color: "#fecaca" }}>
                      {pixError}
                    </div>
                  ) : null}

                  <button style={{ ...styles.button, ...styles.primary, width: "100%", marginTop: 18 }} onClick={handleGeneratePix}>
                    {pixLoading ? "Gerando PIX..." : hasCourse ? "Abrir meu curso" : "Comprar por PIX"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {page === "dashboard" ? (
          <section style={{ padding: "30px 0" }}>
            <div style={{ textAlign: "center", marginBottom: 26 }}>
              <h2 style={{ fontSize: window.innerWidth < 900 ? 34 : 48, margin: 0, fontWeight: 950 }}>Área do aluno</h2>
              <p style={{ color: "#a1a1aa", marginTop: 12 }}>Conta conectada, compras salvas no Firebase e acesso ao curso.</p>
            </div>
            {!isLoggedIn ? (
              <div style={{ ...styles.card, padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>Você ainda não entrou</div>
                <p style={{ color: "#a1a1aa" }}>Faça login para acessar seus dados e o curso.</p>
                <button style={{ ...styles.button, ...styles.primary }} onClick={() => setShowAuth(true)}>Entrar agora</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 900 ? "1fr" : "1.2fr 0.8fr", gap: 22 }}>
                <div style={{ ...styles.card, padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ color: "#8b8b8b" }}>Bem-vindo</div>
                      <div style={{ fontSize: 38, fontWeight: 950 }}>{userData?.name}</div>
                      <div style={{ color: "#a1a1aa", marginTop: 6 }}>{userData?.email}</div>
                    </div>
                    <button style={{ ...styles.button, ...styles.ghost, display: "inline-flex", alignItems: "center", gap: 8 }} onClick={handleLogout}>
                      <LogOut size={16} /> Sair
                    </button>
                  </div>

                  <div style={{ marginTop: 20, padding: 18, borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ color: "#a1a1aa" }}>Progresso geral</span>
                      <span style={{ fontWeight: 800 }}>{hasCourse ? "0%" : "0%"}</span>
                    </div>
                    <div style={{ height: 12, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden", marginTop: 10 }}>
                      <div style={{ height: "100%", width: hasCourse ? "8%" : "0%", background: "linear-gradient(90deg,#991b1b,#ef4444)", borderRadius: 999 }} />
                    </div>
                  </div>

                  <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
                    {LESSONS.map((lesson) => (
                      <div key={lesson.title} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", padding: 16, borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={{ width: 38, height: 38, borderRadius: 999, display: "grid", placeItems: "center", background: "rgba(185,28,28,0.16)", color: "#fecaca" }}>
                            <CheckCircle2 size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{lesson.title}</div>
                            <div style={{ color: "#8b8b8b", marginTop: 4 }}>{lesson.duration}</div>
                          </div>
                        </div>
                        <button style={{ ...styles.button, ...styles.ghost }}>{hasCourse ? "Assistir" : "Bloqueado"}</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 20 }}>
                  <div style={{ ...styles.card, padding: 22 }}>
                    <div style={{ fontSize: 22, fontWeight: 900 }}>Meu curso</div>
                    <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                      {purchases.length > 0 ? purchases.map((course) => (
                        <div key={course.id} style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <div style={{ fontWeight: 800 }}>{course.title}</div>
                          <div style={{ color: "#8b8b8b", marginTop: 6 }}>Status: {course.status || "ativo"}</div>
                          <div style={{ color: "#8b8b8b", marginTop: 4 }}>Pagamento: PIX</div>
                        </div>
                      )) : (
                        <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#a1a1aa" }}>
                          Nenhum curso comprado ainda.
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ ...styles.card, padding: 22 }}>
                    <div style={{ fontSize: 22, fontWeight: 900 }}>Acesso rápido</div>
                    <button style={{ ...styles.button, ...styles.primary, width: "100%", marginTop: 16 }} onClick={() => setPage("course")}>
                      Ver página do curso
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        ) : null}

        {page === "about" ? (
          <section style={{ padding: "30px 0" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: window.innerWidth < 900 ? 34 : 48, margin: 0, fontWeight: 950 }}>Sobre a empresa</h2>
              <p style={{ color: "#a1a1aa", marginTop: 12 }}>Empresa digital focada em educação online e experiência premium.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 900 ? "1fr" : "repeat(3,1fr)", gap: 18 }}>
              {[
                { title: "Missão", text: "Oferecer cursos acessíveis, modernos e práticos para transformar conhecimento em resultado." },
                { title: "Visão", text: "Ser uma plataforma digital forte, bonita e confiável para vendas de cursos online." },
                { title: "Valores", text: "Inovação, qualidade, acessibilidade, compromisso e foco total no aluno." },
              ].map((item) => (
                <div key={item.title} style={{ ...styles.card, padding: 22 }}>
                  <div style={{ fontSize: 28, fontWeight: 950 }}>{item.title}</div>
                  <p style={{ color: "#a1a1aa", lineHeight: 1.7 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {page === "contact" ? (
          <section style={{ padding: "30px 0 40px" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: window.innerWidth < 900 ? 34 : 48, margin: 0, fontWeight: 950 }}>Contato</h2>
              <p style={{ color: "#a1a1aa", marginTop: 12 }}>Tire dúvidas sobre o curso e o acesso à plataforma.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 900 ? "1fr" : "0.9fr 1.1fr", gap: 22 }}>
              <div style={{ ...styles.card, padding: 24 }}>
                <div style={{ fontSize: 24, fontWeight: 900 }}>Fale com a equipe</div>
                <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
                  <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>Email: contato@novamidia.com</div>
                  <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>Curso atual: Marketing Digital</div>
                </div>
              </div>
              <div style={{ ...styles.card, padding: 24 }}>
                <form onSubmit={submitContact} style={{ display: "grid", gap: 14 }}>
                  <input style={styles.input} placeholder="Seu nome" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} />
                  <input style={styles.input} placeholder="Seu e-mail" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
                  <textarea style={styles.textarea} placeholder="Digite sua mensagem" value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} />
                  <button type="submit" style={{ ...styles.button, ...styles.primary }}>Enviar mensagem</button>
                </form>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <footer style={{ textAlign: "center", color: "#71717a", fontSize: 14, padding: "24px 20px 34px", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 20 }}>
        Domínio gratuito atual: nova-midia-site-eb6s.vercel.app
      </footer>

      {showAuth ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.74)", display: "grid", placeItems: "center", padding: 16, zIndex: 100 }}>
          <div style={{ ...styles.card, width: "100%", maxWidth: 920, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 900 ? "1fr" : "0.95fr 1.05fr" }}>
              {window.innerWidth >= 900 ? (
                <div style={{ padding: 32, background: "linear-gradient(160deg, rgba(127,29,29,0.95), rgba(0,0,0,1))", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "inline-block", padding: "8px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.08)", fontSize: 12, fontWeight: 800 }}>acesso premium</div>
                    <div style={{ fontSize: 42, fontWeight: 950, lineHeight: 1.02, marginTop: 18 }}>Entre na sua conta e continue sua jornada</div>
                    <div style={{ color: "rgba(255,255,255,0.78)", marginTop: 16, lineHeight: 1.8 }}>Cadastro real, login com Google e painel conectado ao Firebase.</div>
                  </div>
                  <div style={{ display: "grid", gap: 12 }}>
                    {["Conta real", "Google Login", "Área do aluno"].map((item) => (
                      <div key={item} style={{ display: "flex", gap: 10, alignItems: "center", color: "rgba(255,255,255,0.88)" }}>
                        <CheckCircle2 size={16} color="#fca5a5" /> {item}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div style={{ padding: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 34, fontWeight: 950 }}>{authMode === "register" ? "Criar conta" : "Entrar na conta"}</div>
                    <div style={{ color: "#a1a1aa", marginTop: 8 }}>Use e-mail e senha ou Google.</div>
                  </div>
                  <button style={{ ...styles.button, ...styles.ghost, padding: 10 }} onClick={() => setShowAuth(false)}><X size={18} /></button>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 20, marginBottom: 14 }}>
                  <button style={{ ...styles.button, ...styles.ghost, flex: 1, background: authMode === "login" ? "rgba(185,28,28,0.14)" : "rgba(255,255,255,0.05)", border: authMode === "login" ? "1px solid rgba(239,68,68,0.34)" : "1px solid rgba(255,255,255,0.10)" }} onClick={() => { setAuthMode("login"); resetAuthFeedback(); }}>
                    Entrar
                  </button>
                  <button style={{ ...styles.button, ...styles.ghost, flex: 1, background: authMode === "register" ? "rgba(185,28,28,0.14)" : "rgba(255,255,255,0.05)", border: authMode === "register" ? "1px solid rgba(239,68,68,0.34)" : "1px solid rgba(255,255,255,0.10)" }} onClick={() => { setAuthMode("register"); resetAuthFeedback(); }}>
                    Cadastrar
                  </button>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {authMode === "register" ? (
                    <div style={{ position: "relative" }}>
                      <User size={16} style={{ position: "absolute", left: 14, top: 16, color: "#8b8b8b" }} />
                      <input style={{ ...styles.input, paddingLeft: 42 }} placeholder="Seu nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                  ) : null}
                  <div style={{ position: "relative" }}>
                    <Mail size={16} style={{ position: "absolute", left: 14, top: 16, color: "#8b8b8b" }} />
                    <input style={{ ...styles.input, paddingLeft: 42 }} placeholder="Seu e-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div style={{ position: "relative" }}>
                    <Lock size={16} style={{ position: "absolute", left: 14, top: 16, color: "#8b8b8b" }} />
                    <input type="password" style={{ ...styles.input, paddingLeft: 42 }} placeholder="Sua senha" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  </div>
                  {authError ? <div style={{ padding: 12, borderRadius: 14, background: "rgba(185,28,28,0.12)", border: "1px solid rgba(239,68,68,0.22)", color: "#fecaca" }}>{authError}</div> : null}
                  {authSuccess ? <div style={{ padding: 12, borderRadius: 14, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.22)", color: "#bbf7d0" }}>{authSuccess}</div> : null}
                  <button style={{ ...styles.button, ...styles.primary }} onClick={handleAuth}>{authMode === "register" ? "Criar conta" : "Entrar com conta"}</button>
                  <button style={{ ...styles.button, ...styles.ghost }} onClick={handleGoogleLogin}>Entrar com Google</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showPix ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.74)", display: "grid", placeItems: "center", padding: 16, zIndex: 100 }}>
          <div style={{ ...styles.card, width: "100%", maxWidth: 760 }}>
            <div style={{ padding: 24, borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 30, fontWeight: 950 }}>Pagamento por PIX</div>
                <div style={{ color: "#a1a1aa", marginTop: 8 }}>Curso: {COURSE.title} • Valor: R$ 10,00</div>
              </div>
              <button style={{ ...styles.button, ...styles.ghost, padding: 10 }} onClick={() => setShowPix(false)}><X size={18} /></button>
            </div>
            <div style={{ padding: 24, display: "grid", gridTemplateColumns: window.innerWidth < 900 ? "1fr" : "0.9fr 1.1fr", gap: 22 }}>
              <div style={{ ...styles.card, padding: 20, textAlign: "center" }}>
                <div style={{ color: "#8b8b8b", marginBottom: 12 }}>QR Code PIX</div>
                {pixData?.qrCodeLink ? (
                  <img src={pixData.qrCodeLink} alt="QR Code PIX" style={{ width: "100%", maxWidth: 260, borderRadius: 18, background: "#fff", padding: 12 }} />
                ) : (
                  <div style={{ color: "#a1a1aa" }}>QR Code não disponível.</div>
                )}
              </div>
              <div>
                <div style={{ ...styles.card, padding: 20 }}>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>Código copia e cola</div>
                  <div style={{ marginTop: 12, padding: 14, borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", wordBreak: "break-all", color: "#d4d4d8", lineHeight: 1.6 }}>
                    {pixData?.copiaECola || "Não disponível"}
                  </div>
                  <button style={{ ...styles.button, ...styles.ghost, width: "100%", marginTop: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={copyPixCode}>
                    <Copy size={16} /> {copied ? "Copiado" : "Copiar código"}
                  </button>
                </div>
                <div style={{ ...styles.card, padding: 20, marginTop: 18 }}>
                  <div style={{ color: "#a1a1aa", lineHeight: 1.7 }}>
                    Depois de pagar, clique no botão abaixo para registrar a compra no painel. O webhook automático ainda pode ser adicionado depois, mas o PIX já está sendo gerado de forma real pela API.
                  </div>
                  <button style={{ ...styles.button, ...styles.primary, width: "100%", marginTop: 16 }} onClick={handleMarkAsPaid}>
                    Já paguei / registrar compra
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
