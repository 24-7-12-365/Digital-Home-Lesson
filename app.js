import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, child, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyArvx56ucEnH-JdQkuLNoeWB-jJ-IRYvMM",
  authDomain: "digital-62aa4.firebaseapp.com",
  databaseURL: "https://digital-62aa4-default-rtdb.firebaseio.com",
  projectId: "digital-62aa4",
  storageBucket: "digital-62aa4.firebasestorage.app",
  messagingSenderId: "1046952526852",
  appId: "1:1046952526852:web:1c4454fe3bdb78153fa151",
  measurementId: "G-WKSW7MGL2F"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentUser = null;
let editingUser = null;

// LOGIN
window.login = async function() {
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;

  if (user === "admin" && pass === "admin123") {
    currentUser = { username: "admin", role: "admin" };
    document.getElementById('loginDiv').classList.add('hidden');
    showAdmin();
    return;
  }

  const snapshot = await get(child(ref(db), 'users/' + user));
  if(snapshot.exists()){
    const data = snapshot.val();
    if(data.password === pass){
      currentUser = data;
      document.getElementById('loginDiv').classList.add('hidden');
      if(data.role === 'teacher') showTeacher();
      if(data.role === 'student') showStudent();
    } else alert('Wrong password');
  } else alert('User not found');
}

// ADMIN
function showAdmin(){
  document.getElementById('adminDiv').classList.remove('hidden');
  loadUsers();
}

window.registerUser = function(){
  const u = document.getElementById('newUser').value;
  set(ref(db,'users/'+u),{
    username:u,
    password:document.getElementById('newPass').value,
    role:document.getElementById('role').value,
    class:document.getElementById('class').value,
    subjects:document.getElementById('subjects').value.split(',')
  });
  editingUser = null;
  loadUsers();
}

async function loadUsers(){
  const snap = await get(ref(db,'users'));
  const userList = document.getElementById('userList');
  userList.innerHTML='';
  snap.forEach(child=>{
    const data = child.val();
    const li=document.createElement('li');
    li.innerHTML = `${child.key} (${data.role}) 
    <button onclick="editUser('${child.key}')">Edit</button>
    <button onclick="deleteUser('${child.key}')">Delete</button>`;
    userList.appendChild(li);
  });
}

window.editUser = async function(u){
  const snap = await get(ref(db,'users/'+u));
  const d = snap.val();
  document.getElementById('newUser').value = u;
  document.getElementById('newPass').value = d.password;
  document.getElementById('role').value = d.role;
  document.getElementById('class').value = d.class;
  document.getElementById('subjects').value = d.subjects.join(',');
}

window.deleteUser=function(u){
  remove(ref(db,'users/'+u));
  loadUsers();
}

// TEACHER
function showTeacher(){
  document.getElementById('teacherDiv').classList.remove('hidden');

  const tSubject = document.getElementById('tSubject');
  const tWeek = document.getElementById('tWeek');

  currentUser.subjects.forEach(s=>{
    tSubject.innerHTML+=`<option>${s}</option>`;
  });

  for(let i=1;i<=12;i++) tWeek.innerHTML+=`<option>Week ${i}</option>`;
}

window.addQuestion = function(){
  const div = document.createElement('div');
  div.className='card';
  div.innerHTML = `
    <input placeholder='Question'>
    <input placeholder='Option A'>
    <input placeholder='Option B'>
    <input placeholder='Option C'>
    <input placeholder='Option D'>
    <input placeholder='Correct Answer (A/B/C/D)'>
  `;
  document.getElementById('cbtContainer').appendChild(div);
}

window.saveLesson=function(){
  const questions = [];
  document.querySelectorAll('#cbtContainer .card').forEach(div=>{
    const inputs = div.querySelectorAll('input');
    questions.push({
      q: inputs[0].value,
      options: [inputs[1].value, inputs[2].value, inputs[3].value, inputs[4].value],
      ans: inputs[5].value
    });
  });

  const key = document.getElementById('tSubject').value + '_' + document.getElementById('tWeek').value;

  set(ref(db,'lessons/'+key),{
    class: document.getElementById('tClass').value,
    note:document.getElementById('lessonNote').value,
    video:document.getElementById('videoLink').value,
    image:document.getElementById('imageLink').value,
    cbt:questions,
    theory:document.getElementById('theory').value
  });

  alert('Saved');
}

// STUDENT
function showStudent(){
  document.getElementById('studentDiv').classList.remove('hidden');

  const sSubject = document.getElementById('sSubject');
  const sWeek = document.getElementById('sWeek');

  currentUser.subjects.forEach(s=>{
    sSubject.innerHTML+=`<option>${s}</option>`;
  });

  for(let i=1;i<=12;i++) sWeek.innerHTML+=`<option>Week ${i}</option>`;
}

window.loadLesson=async function(){
  const key = document.getElementById('sSubject').value + '_' + document.getElementById('sWeek').value;

  const snap=await get(ref(db,'lessons/'+key));
  if(snap.exists()){
    const d=snap.val();

    if(d.class !== currentUser.class){
      alert('This lesson is not for your class');
      return;
    }

    let cbtHTML = '';
    d.cbt.forEach((q,i)=>{
      cbtHTML += `<p>${q.q}</p>`;
      q.options.forEach(opt=>{
        cbtHTML += `<label><input type='radio' name='q${i}' value='${opt}'> ${opt}</label><br>`;
      });
    });

    document.getElementById('lessonDisplay').innerHTML=`
    <h4>Lesson Note</h4>
    <p>${d.note}</p>
    <img src="${d.image}" width="100%">
    <iframe width="100%" height="200" src="${d.video}" allow="autoplay"></iframe>
    <h4>CBT</h4>
    ${cbtHTML}
    <button onclick="submitCBT('${key}')">Submit CBT</button>
    <h4>Theory</h4>
    <textarea id='theoryAns'></textarea>
    <button onclick="submitTheory('${key}')">Submit Theory</button>
    `;
  }
}

window.submitCBT=function(key){
  const answers = {};
  document.querySelectorAll('input[type=radio]:checked').forEach(r=>{
    answers[r.name] = r.value;
  });
  set(ref(db,'results/'+currentUser.username+'/'+key),{ answers });
  alert('Submitted');
}

window.submitTheory=function(key){
  set(ref(db,'theory/'+currentUser.username+'/'+key),{
    answer:document.getElementById('theoryAns').value
  });
  alert('Submitted');
}