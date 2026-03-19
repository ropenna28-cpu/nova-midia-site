// APP COMPLETO COM FIREBASE + COMPRAS SALVAS
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

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [courses] = useState([
    { id: 1, title: "Curso Roblox", price: 100 },
    { id: 2, title: "Curso Marketing", price: 80 },
  ]);
  const [purchasedCourses, setPurchasedCourses] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);

        const purchasesRef = collection(db, "users", u.uid, "purchases");
        const snap = await getDocs(purchasesRef);
        const list = snap.docs.map((d) => d.data());
        setPurchasedCourses(list);
      } else {
        setUser(null);
        setPurchasedCourses([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const register = async () => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", cred.user.uid), {
      name,
      email,
    });
  };

  const login = async () => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const u = result.user;

    await setDoc(doc(db, "users", u.uid), {
      name: u.displayName,
      email: u.email,
    });
  };

  const logout = async () => {
    await signOut(auth);
  };

  const buyCourse = async (course) => {
    if (!user) return alert("Faça login primeiro");

    const data = {
      title: course.title,
      price: course.price,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, "users", user.uid, "purchases"), data);

    setPurchasedCourses((prev) => [...prev, data]);
  };

  return (
    <div style={{ padding: 20, background: "black", color: "white", minHeight: "100vh" }}>
      <h1>Nova Midia</h1>

      {!user ? (
        <div>
          <input placeholder="Nome" onChange={(e) => setName(e.target.value)} />
          <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Senha" type="password" onChange={(e) => setPassword(e.target.value)} />

          <button onClick={register}>Cadastrar</button>
          <button onClick={login}>Login</button>
          <button onClick={loginGoogle}>Google</button>
        </div>
      ) : (
        <div>
          <h2>Bem-vindo {user.email}</h2>
          <button onClick={logout}>Sair</button>

          <h3>Cursos</h3>
          {courses.map((c) => (
            <div key={c.id}>
              {c.title} - R${c.price}
              <button onClick={() => buyCourse(c)}>Comprar</button>
            </div>
          ))}

          <h3>Meus cursos</h3>
          {purchasedCourses.map((c, i) => (
            <div key={i}>{c.title}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
