const url = 'https://todoo.5xcamp.us';
let token = '';
// 未完成事項數量
let undoneNum;
// 已完成事項 ID
let doneListId = [];

// 認證相關表單和連結
const signupForm = document.querySelector('#signupForm');
const loginForm = document.querySelector('#loginForm');
const signupLink = document.querySelector('#signupLink');
const loginLink = document.querySelector('#loginLink');
const signupAlert = document.querySelector('#signupAlert');

// 註冊密碼欄位及顯示切換按鈕
const signupPwd = document.querySelector('#signupPwd');
const signupPwdConfirm = document.querySelector('#signupPwdConfirm');
const toggleSignupPwd = document.querySelector('#toggleSignupPwd');
const toggleLoginPwd = document.querySelector('#toggleLoginPwd');
const togglePwdConfirm = document.querySelector('#togglePwdConfirm');

// 頁面區塊
const todolistPage = document.querySelector('#todolistPage');
const authPage = document.querySelector('#authPage');

// 代辦清單相關
const list = document.querySelector('#list');
const undoneNumber = document.querySelector('#undoneNumber');
const addTodoButton = document.querySelector('#addTodoButton');
const logoutButton = document.querySelector('#logoutButton');
const clearAll = document.querySelector('#clearAll');

// 頁籤
const tab = document.querySelector('#tab');


// ===== 函式 =====

// 顯示和隱藏函式
function toggleDisplay(showEl, hideEl) {
  showEl.classList.remove('display-none');
  hideEl.classList.add('display-none');
}

// 取得在 cookie 的 token
function getCookie() {
  return document.cookie.replace(/(?:(?:^|.*;\s*)todoToken\s*=\s*([^;]*).*$)|^.*$/, '$1');
} 

// 防止 XSS 攻擊的字串
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


// ===== Users =====

// 註冊
function signup(email, nickname, password) {
  axios.post(`${url}/users`, {
    "user": {
      "email": email,
      "nickname": nickname,
      "password": password
    }
  })
  .then(res => {
    alert('註冊成功，請登入!');
    toggleDisplay(loginForm, signupForm);
  })
  .catch(err => {
    signupAlert.classList.remove('display-none');
    signupAlert.innerHTML = err.response.data.error;
  })
}

// 登入
function login(email, password) {
  axios.post(`${url}/users/sign_in`,{
    "user": {
      "email": email,
      "password": password
    }
  })
  .then(res => {
    token = res.headers.authorization;

    // token 存入 cookie 到今天晚上 23:59:59
    const expiresDate = new Date();
    expiresDate.setHours(23, 59, 59, 999); 
    const expires = expiresDate.toUTCString();

    // token 寫入 cookie，token 自動帶入 headers
    document.cookie = `todoToken=${token}; expires=${expires};`;
    axios.defaults.headers.common.Authorization = getCookie();
    
    getTodo();
    toggleDisplay(todolistPage, authPage);
  })
  .catch(err => {
    const loginAlert = document.querySelector('#loginAlert');
    loginAlert.classList.remove('display-none');
    loginAlert.innerHTML = `${err?.response?.data?.message}，請重新確認信箱與密碼`;
  })
}

// 登出
function logout() {
  axios.delete(`${url}/users/sign_out`)
  .then(res => {
    // 清除 cookie 和 axios 標頭
    document.cookie = "todoToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    delete axios.defaults.headers.common.Authorization;

    alert('已登出!')
    toggleDisplay(authPage, todolistPage);
  })
  .catch(err => {
  const message = err?.response?.data?.message || '發生錯誤，請稍後再試';
    alert(message);
  })
}


// ===== Todos =====

// 取得事項
function getTodo(status = 'all') {
  axios.get(`${url}/todos`)
  .then(res => {
    const todolist = res.data.todos;
    filter(todolist, status);
  })
  .catch(err => {
    const message = err?.response?.data?.message || '發生錯誤，請稍後再試';
    alert(message);
  })
}

// 分類事項
function filter(todolist, status) {
  undoneNum = 0;

  // 分類事項狀態
  const statusList = todolist.filter(todo => {
    if(status == 'all') return true;
    if(status == 'undone') return !todo.completed_at;
    if(status == 'done') return todo.completed_at;
  });
  renderList(statusList);

  // 計算未完成數量
  const undone = todolist.filter(todo => !todo.completed_at);
  undoneNum = undone.length;
  
  // 取得已完成id
  const doneList = todolist.filter(todo => todo.completed_at);
  doneListId = doneList.map(todo => todo.id);
  undoneNumber.innerHTML = `${undoneNum}個待完成項目`;
}

// 渲染清單
function renderList(statusList) {
  let str = '';
  statusList.forEach((item) => {
    const checked = item.completed_at ? 'checked' : '';
    str +=  `
      <li>
        <input type="checkbox" data-id="${item.id}" id="check${item.id}"
          class="list-checkbox" ${checked}>
        <label for="check${item.id}" id="label${item.id}">
          ${escapeHTML(item.content)}
        </label>
        <input type="text" data-id="${item.id}" id="input${item.id}" class="display-none">
        <a data-id="${item.id}" class="edit-button">
          <i class="fa-solid fa-pen-to-square"></i>
        </a>
        <a data-id="${item.id}" class="delete-button">
          <i class="fa-solid fa-trash"></i>
        </a>
      </li>
    `;
  });
  list.innerHTML = str;
}

// 新增事項
function addTodo(todo) {
  axios.post(`${url}/todos`,{
    "todo": {
      "content": todo
    }
  })
  .then(res => {
    getTodo();
  })
  .catch(err => {
    const message = err?.response?.data?.message || '發生錯誤，請稍後再試';
    alert(message);
  })
}

// 刪除事項
function delTodo(id, type) {
  axios.delete(`${url}/todos/${id}`)
  .then(res => {
    if(type === 'single') {
      alert('刪除成功!');
    }else if(type === 'all'){
      alert('全部刪除成功!');
    }

    getTodo();
  })
  .catch(err => {
    const message = err?.response?.data?.message || '發生錯誤，請稍後再試';
    alert(message);
  })
}

// 編輯事項
function editTodo(id, str) {
  axios.put(`${url}/todos/${id}`,{
    "todo": {
      "content": str
    }
  })
  .then(res => {
    alert('修改成功!');
    getTodo();
  })
  .catch(err => {
    const message = err?.response?.data?.message || '發生錯誤，請稍後再試';
    alert(message);
  })
}

//切換已完成
function toggleTodo(id) {
  axios.patch(`${url}/todos/${id}/toggle`)
  .then(res => {

    // 判斷待完成事項數量
    if(!res.data.completed_at) {
      undoneNum++;
    } else {
      undoneNum--;
    }
    undoneNumber.innerHTML = `${undoneNum}個待完成項目`;

    // 判斷已完成事項
    if(doneListId.includes(id)) {
      const index = doneListId.indexOf(id);
      doneListId.splice(index, 1);
    } else {
      doneListId.push(id);
    }
  })
  .catch(err => {
    const message = err?.response?.data?.message || '發生錯誤，請稍後再試';
    alert(message);
  })
}


// ===== 事件監聽 =====

// 刷新時取得 token 後跳轉到 todolist 頁面
document.addEventListener('DOMContentLoaded', () =>{
  axios.defaults.headers.common.Authorization = getCookie();

  axios.get(`${url}/check`)
  .then(res => {
    getTodo();
    toggleDisplay(todolistPage, authPage);
  })
  .catch(err => {
  })
})

// 點擊切到註冊表單
signupLink.addEventListener('click', ()=> {
  toggleDisplay(signupForm, loginForm);
})

// 點擊切到登入表單
loginLink.addEventListener('click', ()=> {
  toggleDisplay(loginForm, signupForm);
})

// 註冊表單
signupForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const signupEmail = document.querySelector('#signupEmail');
  const signupName = document.querySelector('#signupName');

  // 密碼驗證
  if(signupPwd.value != signupPwdConfirm.value) {
    signupAlert.classList.remove('display-none');
    signupAlert.innerHTML = '密碼不相同';
  } else {
    signupAlert.classList.add('display-none');
    signup(signupEmail.value, signupName.value, signupPwd.value);
  }  
})

// 登入表單
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const loginEmail = document.querySelector('#loginEmail');
  const loginPwd = document.querySelector('#loginPwd');

  login(loginEmail.value, loginPwd.value);
})

// 註冊密碼圖示切換
toggleSignupPwd.addEventListener('click', () => {
  const isHidden = signupPwd.type === 'password';

  signupPwd.type = isHidden ? 'text' : 'password';
  toggleSignupPwd.innerHTML = isHidden ?
    `<i class="fa-solid fa-eye"></i>` :
    `<i class="fa-solid fa-eye-slash"></i>`;
})

// 註冊再次輸入密碼圖示切換
togglePwdConfirm.addEventListener('click', () => {
  const isHidden = signupPwdConfirm.type === 'password';

  signupPwdConfirm.type = isHidden ? 'text' : 'password';
  togglePwdConfirm.innerHTML = isHidden ?
    `<i class="fa-solid fa-eye"></i>` :
    `<i class="fa-solid fa-eye-slash"></i>`;
})

// 登入密碼圖示切換
toggleLoginPwd.addEventListener('click', () => {
  const isHidden = loginPwd.type === 'password';

  loginPwd.type = isHidden ? 'text' : 'password';
  toggleLoginPwd.innerHTML = isHidden ?
    `<i class="fa-solid fa-eye"></i>` :
    `<i class="fa-solid fa-eye-slash"></i>`;
})

// 新增
addTodoButton.addEventListener('click', () => {
  const todolistInput = document.querySelector('#todolistInput');
  if(todolistInput.value != '') {
    addTodo(todolistInput.value);
  } else {
    alert('新增代辦事項不能為空');
  }
  todolistInput.value = '';
})

// 登出
logoutButton.addEventListener('click', () => {
  logout();
})

// 編輯和刪除
list.addEventListener('click', e => {
  const delButton = e.target.closest('.delete-button');
  const editButton = e.target.closest('.edit-button');
  const listCheckBox = e.target.closest('.list-checkbox');
  
  // 點擊刪除按鈕
  if(delButton) {
    if(confirm('確定要刪除嗎')) {
      delTodo(delButton.dataset.id, 'single');
    }

  // 點擊編輯按鈕
  } else if(editButton){
    const editInput = document.querySelector(`#input${editButton.dataset.id}`);
    const editlabel = document.querySelector(`#label${editButton.dataset.id}`);
    
    if (editInput.value) {
      editTodo(editButton.dataset.id, editInput.value);
    } else {
      toggleDisplay(editInput, editlabel);
    }

  // 切換是否完成
  } else if(listCheckBox) {
    toggleTodo(listCheckBox.dataset.id);
  }
})

// 清除已完成事項
clearAll.addEventListener('click', () => {
  if (doneListId.length === 0) {
    alert('沒有已完成項目可刪除！');

  } else if (confirm('確定要全部清除已完成事項？')) {
    doneListId.forEach((id, i) => {
      // 最後一個時再顯示 alert('全部刪除成功!');
      if(doneListId.length === i+1) {
        delTodo(id, 'all');
      }
      delTodo(id);
    })
  }
})

// 事項分類
tab.addEventListener('click', e=> {
  document.querySelectorAll('#tab li').forEach(item => {
    item.classList.remove('active');
  });
  e.target.classList.add('active');

  getTodo(e.target.dataset.status);
})