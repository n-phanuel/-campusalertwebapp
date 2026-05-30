/* ============================================================
   CampusAlert — Shared Application Logic
   All auth, data, and session management via localStorage
   ============================================================ */

const DB = {
  init() {
    if (!localStorage.getItem('ca_initialized')) {
      const users = [
        { id:'u1', role:'admin',   name:'Dr. Joseph Amutenya',  email:'admin@unam.na',   password:'admin123',   studentNo:'STAFF-001', faculty:'Facilities Management' },
        { id:'u2', role:'student', name:'Amara Nghifindaka',    email:'amara@unam.na',   password:'student123', studentNo:'220042871', faculty:'Engineering & IT' },
        { id:'u3', role:'student', name:'Tomas Shipanga',       email:'tomas@unam.na',   password:'student123', studentNo:'220038412', faculty:'Natural Sciences' },
      ];
      localStorage.setItem('ca_users', JSON.stringify(users));

      const issues = [
        { id:'UNAM-1042', userId:'u3', category:'Security',        title:'Entrance gate not locking',              description:'The North Gate entrance barrier has been broken since last week. Anyone can enter without scanning.', location:'Parking Area B, North Gate',            priority:'High',   status:'In Progress', createdAt:daysAgo(3),  updatedAt:daysAgo(1),  assignedTo:'Facilities Team',  images:[], comments:[{author:'Dr. Amutenya', text:'Team dispatched. Parts ordered.',               at:daysAgo(1)}]  },
        { id:'UNAM-1043', userId:'u2', category:'Furniture',       title:'6 broken chairs in tutorial room',       description:'Multiple chairs with broken backs in room 214. Students have to stand during class.',               location:'Humanities Block, Room 214',            priority:'Low',    status:'Resolved',    createdAt:daysAgo(4),  updatedAt:daysAgo(1),  assignedTo:'Maintenance',      images:[], comments:[{author:'Dr. Amutenya', text:'All chairs replaced. Issue closed.',            at:daysAgo(1)}]  },
        { id:'UNAM-1044', userId:'u3', category:'Sanitation',      title:'Overflowing bins — strong odour',        description:'Corridor bins not emptied for 4 days. Strong smell affecting studying students.',                       location:'Science Building, Ground Floor',        priority:'Medium', status:'Open',        createdAt:daysAgo(2),  updatedAt:daysAgo(2),  assignedTo:null,               images:[], comments:[] },
        { id:'UNAM-1045', userId:'u2', category:'Electrical',      title:'Power socket sparking dangerously',      description:'A power strip in Computer Lab 3 is sparking when devices are plugged in. Fire risk!',                  location:'ICT Building, Computer Lab 3',          priority:'High',   status:'In Progress', createdAt:daysAgo(1),  updatedAt:hoursAgo(6), assignedTo:'Electrical Dept',  images:[], comments:[{author:'Dr. Amutenya', text:'Electrician on site. Lab temporarily closed.', at:hoursAgo(5)}] },
        { id:'UNAM-1046', userId:'u3', category:'AV / Projector',  title:'Projector lamp blown — Lecture Hall 7',  description:'The projector in Hall 7 has a blown lamp. Lecturers cannot display slides.',                           location:'Engineering Block, Lecture Hall 7',     priority:'Medium', status:'Resolved',    createdAt:daysAgo(1),  updatedAt:hoursAgo(3), assignedTo:'IT Support',       images:[], comments:[{author:'Dr. Amutenya', text:'Lamp replaced. Projector tested and working.',  at:hoursAgo(3)}] },
        { id:'UNAM-1047', userId:'u2', category:'Water / Plumbing',title:'Burst pipe in female ablution block',    description:'Water is flooding the female toilet area in Hostel Block F. Urgent plumbing needed.',                   location:'Hostel Block F, Female Ablutions',      priority:'High',   status:'In Progress', createdAt:hoursAgo(5), updatedAt:hoursAgo(2), assignedTo:'Plumbing Crew',    images:[], comments:[{author:'Dr. Amutenya', text:'Plumbers on site. Water temporarily shut off.', at:hoursAgo(2)}] },
        { id:'UNAM-1048', userId:'u3', category:'WiFi / Network',  title:'No WiFi in Main Library reading hall',   description:'The entire reading area on Floor 2 of the Main Library has had no WiFi since Monday. 50+ students affected.', location:'Main Library, Block C, Floor 2',       priority:'High',   status:'Open',        createdAt:hoursAgo(2), updatedAt:hoursAgo(2), assignedTo:null,               images:[], comments:[] },
      ];
      localStorage.setItem('ca_issues', JSON.stringify(issues));
      localStorage.setItem('ca_initialized', 'true');
    }
  },

  login(email, password) {
    const users = JSON.parse(localStorage.getItem('ca_users')||'[]');
    const user  = users.find(u => u.email===email && u.password===password);
    if (user) { localStorage.setItem('ca_session', JSON.stringify(user)); return user; }
    return null;
  },
  logout()        { localStorage.removeItem('ca_session'); window.location.href='login.html'; },
  session()       { const s=localStorage.getItem('ca_session'); return s?JSON.parse(s):null; },
  requireAuth()   { if(!this.session()) window.location.href='login.html'; },
  requireAdmin()  { const s=this.session(); if(!s||s.role!=='admin') window.location.href=s?'student_dashboard.html':'login.html'; },

  register(data) {
    const users=JSON.parse(localStorage.getItem('ca_users')||'[]');
    if(users.find(u=>u.email===data.email)) return {error:'Email already registered.'};
    const user={id:'u'+Date.now(), role:'student', ...data};
    users.push(user);
    localStorage.setItem('ca_users', JSON.stringify(users));
    localStorage.setItem('ca_session', JSON.stringify(user));
    return user;
  },

  getIssues()         { return JSON.parse(localStorage.getItem('ca_issues')||'[]'); },
  saveIssues(issues)  { localStorage.setItem('ca_issues', JSON.stringify(issues)); },
  getMyIssues()       { const s=this.session(); return this.getIssues().filter(i=>i.userId===s?.id); },

  createIssue(data) {
    const s=this.session();
    const issues=this.getIssues();
    const id='UNAM-'+(1049+issues.length);
    const issue={ id, userId:s.id, ...data, status:'Open', assignedTo:null, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), images:[], comments:[] };
    issues.push(issue);
    this.saveIssues(issues);
    return issue;
  },

  updateIssue(id, patch) {
    const issues=this.getIssues();
    const idx=issues.findIndex(i=>i.id===id);
    if(idx===-1) return null;
    issues[idx]={...issues[idx], ...patch, updatedAt:new Date().toISOString()};
    this.saveIssues(issues);
    return issues[idx];
  },

  addComment(id, text) {
    const s=this.session();
    const issues=this.getIssues();
    const idx=issues.findIndex(i=>i.id===id);
    if(idx===-1) return;
    issues[idx].comments.push({author:s.name, text, at:new Date().toISOString()});
    issues[idx].updatedAt=new Date().toISOString();
    this.saveIssues(issues);
  },

  getStats() {
    const all=this.getIssues();
    return { total:all.length, open:all.filter(i=>i.status==='Open').length, inProgress:all.filter(i=>i.status==='In Progress').length, resolved:all.filter(i=>i.status==='Resolved').length, high:all.filter(i=>i.priority==='High').length };
  },
};

function daysAgo(n)  { const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString(); }
function hoursAgo(n) { const d=new Date(); d.setHours(d.getHours()-n); return d.toISOString(); }

function timeAgo(iso) {
  const diff=(Date.now()-new Date(iso))/1000;
  if(diff<60)    return 'Just now';
  if(diff<3600)  return Math.floor(diff/60)+'m ago';
  if(diff<86400) return Math.floor(diff/3600)+'h ago';
  return Math.floor(diff/86400)+'d ago';
}

function statusPill(status) {
  const m={'Open':'status-open','In Progress':'status-progress','Resolved':'status-resolved'};
  return `<span class="status-pill ${m[status]||'status-open'}">${status}</span>`;
}
function priorityBadge(p) {
  const m={High:'priority-high',Medium:'priority-medium',Low:'priority-low'};
  return `<span class="${m[p]||'priority-low'}">● ${p}</span>`;
}

DB.init();
