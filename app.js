// 🔥 FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// SIGNUP
async function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  const userClass = document.getElementById('class').value;
  const subjects = document.getElementById('subjects').value.split(',');

  const user = await auth.createUserWithEmailAndPassword(email, password);

  await db.collection("users").doc(user.user.uid).set({
    email,
    role,
    class: userClass,
    subjects,
    approved: false
  });

  alert("Signup successful. Await admin approval.");
}

// LOGIN
async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const userCred = await auth.signInWithEmailAndPassword(email, password);
  const uid = userCred.user.uid;

  const doc = await db.collection("users").doc(uid).get();
  const data = doc.data();

  if (!data.approved) {
    alert("Await admin approval");
    return;
  }

  showDashboard(data.role, uid);
}

// SHOW DASHBOARD
function showDashboard(role, uid) {
  document.getElementById('auth').classList.add('hidden');

  if (role === "admin") {
    document.getElementById('adminDashboard').classList.remove('hidden');
    loadPendingUsers();
  }
  if (role === "teacher") {
    document.getElementById('teacherDashboard').classList.remove('hidden');
  }
  if (role === "student") {
    document.getElementById('studentDashboard').classList.remove('hidden');
  }
}

// ADMIN: LOAD PENDING USERS
async function loadPendingUsers() {
  const snapshot = await db.collection("users")
    .where("approved", "==", false)
    .get();

  let html = "";
  snapshot.forEach(doc => {
    const user = doc.data();
    html += `
      <div>
        ${user.email} - ${user.role} - ${user.class}
        <button onclick="approveUser('${doc.id}')">Approve</button>
      </div>
    `;
  });

  document.getElementById('pendingUsers').innerHTML = html;
}

async function approveUser(uid) {
  await db.collection("users").doc(uid).update({ approved: true });
  loadPendingUsers();
}

// TEACHER: UPLOAD LESSON
async function uploadLesson() {
  const subject = document.getElementById('teacherSubject').value;
  const week = document.getElementById('week').value;
  const note = document.getElementById('lessonNote').value;
  const video = document.getElementById('videoLink').value;
  const obj = document.getElementById('objectiveQ').value;
  const theory = document.getElementById('theoryQ').value;

  await db.collection("lessons").add({
    subject,
    week,
    note,
    video,
    objective: JSON.parse(obj),
    theory
  });

  alert("Lesson uploaded");
}

// STUDENT: LOAD LESSON
async function loadLesson() {
  const subject = document.getElementById('studentSubject').value;
  const week = document.getElementById('studentWeek').value;

  const snapshot = await db.collection("lessons")
    .where("subject", "==", subject)
    .where("week", "==", week)
    .get();

  snapshot.forEach(doc => {
    const data = doc.data();

    document.getElementById('lessonDisplay').innerHTML = `
      <h3>${subject} - Week ${week}</h3>
      <p>${data.note}</p>
      <iframe src="${data.video}" autoplay></iframe>
    `;

    loadCBT(data);
  });
}

// CBT
function loadCBT(data) {
  let html = "";

  data.objective.forEach((q, i) => {
    html += `<p>${q.question}</p>`;
    q.options.forEach(opt => {
      html += `<input type="radio" name="q${i}" value="${opt}">${opt}<br>`;
    });
  });

  html += `<button onclick="submitCBT()">Submit</button>`;
  document.getElementById('cbtSection').innerHTML = html;
}

// STUDENT QUESTION
async function askQuestion() {
  const text = document.getElementById('studentQuestion').value;

  await db.collection("questions").add({
    text,
    date: new Date()
  });

  alert("Question submitted");
}
