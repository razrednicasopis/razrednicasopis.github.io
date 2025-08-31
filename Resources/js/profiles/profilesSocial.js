import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, getDoc, doc, addDoc, arrayUnion, arrayRemove, updateDoc, collection, onSnapshot, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
  authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
  projectId: "razrednicasopisdatabase-29bad",
  storageBucket: "razrednicasopisdatabase-29bad.appspot.com",
  messagingSenderId: "294018128318",
  appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let overlay = document.getElementById('commentOverlay');
if (!overlay) {
  overlay = document.createElement('div');
  overlay.id = 'commentOverlay';
  overlay.style.position = 'fixed';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(0,0,0,0.6)';
  overlay.style.display = 'none';
  overlay.style.zIndex = 999;
  document.body.appendChild(overlay);
}

export function initializeInteractions() {
  onAuthStateChanged(auth, (user) => {
    if (!user) return;
    const userUid = user.uid;
    const postsContainer = document.getElementById("postsContainer");
    if (!postsContainer) return;

    postsContainer.addEventListener("click", async (e) => {
      if (e.target.closest(".like-btn")) {
        const btn = e.target.closest(".like-btn");
        await toggleLike(btn.dataset.postid, userUid, btn);
      }
      if (e.target.closest(".comment-btn")) {
        const btn = e.target.closest(".comment-btn");
        openCommentPopup(btn.dataset.postid, userUid, btn);
      }
    });
  });
}

async function toggleLike(postId, uid, btn) {
  const postRef = doc(db, "profilePosts", postId);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) return;
  const likes = postSnap.data().likes || [];
  if (likes.includes(uid)) await updateDoc(postRef, { likes: arrayRemove(uid) });
  else await updateDoc(postRef, { likes: arrayUnion(uid) });
  btn.querySelector(".like-count").textContent = (await getDoc(postRef)).data().likes?.length || 0;
}

async function openCommentPopup(postId, userUid, commentBtn = null) {
  overlay.style.display = "block";
  let popup = document.getElementById('commentPopup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'commentPopup';
    popup.style.cssText = "position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:700px; max-height:80vh; background:#fff; border-radius:10px; padding:15px; overflow-y:auto; z-index:1000; display:flex; flex-direction:column;";
    document.body.appendChild(popup);
  }
  popup.style.display = 'flex';

  popup.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
      <h3>Komentarji</h3>
      <button id="closeCommentPopup" style="background:none; border:none; font-size:18px; cursor:pointer;">✖</button>
    </div>
    <div id="commentList" style="display:flex; flex-direction:column; gap:8px; margin-bottom:10px;">
      <strong id="noCommentsMsg">Ta objava trenutno še ne vsebuje komentarjev. Prispevajte prvi!</strong>
    </div>
    <div style="display:flex; gap:5px; margin-top:auto;">
      <input type="text" id="newCommentInput" placeholder="Dodaj komentar..." style="flex:1; padding:5px; border-radius:6px; border:1px solid #ccc;">
      <button id="sendCommentBtn" style="padding:5px 10px; border:none; border-radius:6px; background:#1da1f2; color:white; cursor:pointer;">Pošlji</button>
    </div>
  `;

  document.getElementById('closeCommentPopup').onclick = () => {
    overlay.style.display = 'none';
    popup.style.display = 'none';
  };

  const commentList = document.getElementById('commentList');
  const inputField = document.getElementById('newCommentInput');
  const sendBtn = document.getElementById('sendCommentBtn');
  const noCommentsMsg = document.getElementById('noCommentsMsg');

  const commentsRef = collection(db, "profileCommentsRef");
  const commentsQuery = query(commentsRef, where("postId", "==", postId));
  const commentsDOM = {};

  onSnapshot(commentsQuery, async (querySnapshot) => {
    commentList.innerHTML = '';
    let commentCount = 0;

    if (querySnapshot.empty) {
      noCommentsMsg.style.display = 'block';
      commentList.appendChild(noCommentsMsg);
    } else {
      noCommentsMsg.style.display = 'none';
      querySnapshot.forEach(async (docSnap) => {
        commentCount++;
        const commentData = docSnap.data();
        const commentId = docSnap.id;
        if (commentsDOM[commentId]) return;

        const userSnap = await getDoc(doc(db, "users", commentData.uid));
        const username = userSnap.exists() ? userSnap.data().Username || "Unknown" : "Unknown";

        let avatarURL = "avatarPFP.png";
        const pfpSnap = await getDoc(doc(db, "pfpData", commentData.uid));
        if (pfpSnap.exists() && pfpSnap.data().profilePicture?.startsWith("data:image")) avatarURL = pfpSnap.data().profilePicture;

        const commentEl = document.createElement('div');
        commentEl.style.cssText = "display:flex; flex-direction:column; padding:8px; border-bottom:1px solid #eee; border-radius:6px; background-color:#fafafa; gap:5px;";
        commentEl.innerHTML = `
          <div style="display:flex; align-items:center; gap:10px;">
            <img src="${avatarURL}" style="width:30px; height:30px; border-radius:50%;" />
            <strong>${username}</strong>
            <small style="color:gray; margin-left:10px;">${new Date(commentData.timestamp).toLocaleString()}</small>
          </div>
          <div style="margin-left:40px; margin-top:2px;">${commentData.content}</div>
          <div style="display:flex; gap:5px; align-items:center; margin-left:40px;">
            <button class="comment-like-btn" style="background:none; border:none; color:#007bff; cursor:pointer;">
              ❤️ <span class="like-count">${commentData.likes?.length || 0}</span>
            </button>
            ${commentData.uid === userUid ? `<button class="comment-delete-btn" style="background:none; border:none; color:red; cursor:pointer;">🗑</button>` : ''}
          </div>
        `;
        commentList.appendChild(commentEl);
        commentsDOM[commentId] = commentEl;

        // Like comment
        const likeBtn = commentEl.querySelector('.comment-like-btn');
        const likeCountEl = likeBtn.querySelector('.like-count');
        likeBtn.addEventListener('click', async () => {
          const commentRef = doc(db, "profileCommentsRef", commentId);
          const commentSnap = await getDoc(commentRef);
          const likes = commentSnap.data().likes || [];
          if (likes.includes(userUid)) await updateDoc(commentRef, { likes: arrayRemove(userUid) });
          else await updateDoc(commentRef, { likes: arrayUnion(userUid) });
          likeCountEl.textContent = (await getDoc(commentRef)).data().likes?.length || 0;
        });

        // Delete comment
        const deleteBtn = commentEl.querySelector('.comment-delete-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', async () => {
            if (confirm("Ali želiš izbrisati ta komentar?")) {
              await deleteDoc(doc(db, "profileCommentsRef", commentId));
              commentEl.remove();
              delete commentsDOM[commentId];
              if (Object.keys(commentsDOM).length === 0) noCommentsMsg.style.display = 'block';
            }
          });
        }
      });
    }

    // Update comment button count if provided
    if (commentBtn) commentBtn.textContent = `💬 Komentarji (${commentCount})`;
  });

  // Add new comment
  sendBtn.onclick = async () => {
    const content = inputField.value.trim();
    if (!content) return;

    const userSnap = await getDoc(doc(db, "users", userUid));
    const username = userSnap.exists() ? userSnap.data().Username || "Unknown" : "Unknown";

    await addDoc(commentsRef, {
      postId,
      uid: userUid,
      username,
      content,
      timestamp: new Date().toISOString(),
      likes: []
    });

    inputField.value = '';
    noCommentsMsg.style.display = 'none';
  };
}
