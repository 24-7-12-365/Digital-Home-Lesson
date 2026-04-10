// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, update, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyArvx56ucEnH-JdQkuLNoeWB-jJ-IRYvMM",
  authDomain: "digital-62aa4.firebaseapp.com",
  databaseURL: "https://digital-62aa4-default-rtdb.firebaseio.com",
  projectId: "digital-62aa4",
  storageBucket: "digital-62aa4.appspot.com",
  messagingSenderId: "1046952526852",
  appId: "1:1046952526852:web:1c4454fe3bdb78153fa151"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// ================= SIGN UP =================
window.signUp = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const role = document.getElementById("role").value;
  const name = document.getElementById("name").value;
  const userClass = document.getElementById("class").value;
  const subjects = document.getElementById("subjects").value.split(",");

  const userCred = await createUserWithEmailAndPassword(auth, email, password);

  await set(ref(db, "users/" + userCred.user.uid), {
    name,
    email,
    role,
    class: userClass,
    subjects,
    approved: false
  });

  alert("Signup successful. Await admin approval.");
};

// ================= LOGIN =================
window.login = async function () {
  const email = loginEmail.value;
  const password = loginPassword.value;

  const userCred = await signInWithEmailAndPassword(auth, email, password);
  const uid = userCred.user.uid;

  const snapshot = await get(ref(db, "users/" + uid));
  const user = snapshot.val();

  if (!user.approved) {
    alert("Await admin approval.");
    return;
  }

  showDashboard(user);
};

// ================= DASHBOARD SWITCH =================
function showDashboard(user) {
  document.getElementById("auth-section").classList.add("hidden");

  if (user.role === "admin") {
    adminDashboard();
  } else if (user.role === "teacher") {
    teacherDashboard(user);
  } else {
    studentDashboard(user);
  }
}

// ================= ADMIN =================
async function adminDashboard() {
  document.getElementById("admin-dashboard").classList.remove("hidden");

  const snapshot = await get(ref(db, "users"));
  const users = snapshot.val();

  let html = "<h3>Pending Users</h3>";

  for (let uid in users) {
    if (!users[uid].approved) {
      html += `
        <div>
          ${users[uid].name} - ${users[uid].role}
          <button onclick="approveUser('${uid}')">Approve</button>
        </div>`;
    }
  }

  document.getElementById("pending-users").innerHTML = html;
}

window.approveUser = async function (uid) {
  await update(ref(db, "users/" + uid), { approved: true });
  alert("Approved");
  location.reload();
};

// ================= TEACHER =================
function teacherDashboard(user) {
  document.getElementById("teacher-dashboard").classList.remove("hidden");

  const subjectSelect = document.getElementById("teacher-subject");
  user.subjects.forEach(sub => {
    let opt = document.createElement("option");
    opt.value = sub;
    opt.innerText = sub;
    subjectSelect.appendChild(opt);
  });
}

window.saveLesson = async function () {
  const subject = document.getElementById("teacher-subject").value;
  const week = document.getElementById("teacher-week").value;

  const note = document.getElementById("lesson-note").value;
  const video = document.getElementById("video-link").value;
  const obj = document.getElementById("obj-questions").value;
  const theory = document.getElementById("theory-questions").value;

  await set(ref(db, `lessons/${subject}/${week}`), {
    note,
    video,
    obj,
    theory
  });

  alert("Lesson Saved");
};

// ================= STUDENT =================
function studentDashboard(user) {
  document.getElementById("student-dashboard").classList.remove("hidden");

  const subjectSelect = document.getElementById("student-subject");

  user.subjects.forEach(sub => {
    let opt = document.createElement("option");
    opt.value = sub;
    opt.innerText = sub;
    subjectSelect.appendChild(opt);
  });
}

window.loadLesson = async function () {
  const subject = studentSubject.value;
  const week = studentWeek.value;

  const snapshot = await get(ref(db, `lessons/${subject}/${week}`));
  const lesson = snapshot.val();

  document.getElementById("lesson-display").innerHTML = lesson.note;

  document.getElementById("video-display").innerHTML = `
    <iframe width="400" height="300" src="${lesson.video}" allow="autoplay"></iframe>
  `;

  document.getElementById("cbt-section").innerHTML = `
    <h3>Objective</h3>
    ${lesson.obj}
    <h3>Theory</h3>
    ${lesson.theory}
  `;
};

// ================= STUDENT QUESTIONS =================
window.submitQuestion = async function () {
  const question = document.getElementById("student-question").value;

  await push(ref(db, "questions"), {
    question,
    time: Date.now()
  });

  alert("Question submitted");
};
