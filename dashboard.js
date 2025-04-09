// Core functionality for the Friend Tracker dashboard - manages friends list, displays friend details, and handles user interactions

import {
  fetchFriendData,
  fetchProblemsSolvedData,
  fetchRecentSubmissions,
  fetchContestInfo,
  checkUserExists,
} from './api.js';

// Utility Functions

function showNotification(message, type = 'info') {
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => notification.remove());

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function getRelativeTime(timestamp) {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'seconds');
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return rtf.format(-minutes, 'minutes');
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return rtf.format(-hours, 'hours');
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return rtf.format(-days, 'days');
  }
}

// UI Update Functions

function renderFriendsList(friends) {
  const friendsList = document.getElementById('friends-list');
  friendsList.innerHTML = '';

  if (friends.length === 0) {
    friendsList.innerHTML = '<div class="empty-state">No friends added yet.</div>';
    return;
  }

  friends.forEach(friend => {
    const friendItem = document.createElement('div');
    friendItem.classList.add('friend-item');
    friendItem.textContent = friend;

    friendItem.addEventListener('click', () => {
      document.querySelectorAll('.friend-item').forEach(item => item.classList.remove('active'));

      friendItem.classList.add('active');

      loadFriendDetails(friend);
    });

    friendsList.appendChild(friendItem);
  });
}

function updateRecentSubmissions(container, submissions) {
  const activityList = container.querySelector('.activity-list');
  activityList.innerHTML = '';

  if (submissions.length === 0) {
    activityList.innerHTML = '<p class="no-data">No recent submissions available</p>';
    return;
  }

  submissions.forEach(submission => {
    const activityItem = document.createElement('a');
    activityItem.className = 'activity-item';
    activityItem.href = `https://leetcode.com/submissions/detail/${submission.id}`;
    activityItem.target = '_blank';
    activityItem.rel = 'noopener noreferrer';

    const problemTitle = document.createElement('div');
    problemTitle.className = 'problem-title';
    problemTitle.textContent = submission.title;

    const activityTime = document.createElement('div');
    activityTime.className = 'activity-time';
    activityTime.textContent = getRelativeTime(new Date(submission.timestamp).getTime());

    activityItem.appendChild(problemTitle);
    activityItem.appendChild(activityTime);
    activityList.appendChild(activityItem);
  });
}

function updatePastContests(container, contestHistory) {
  const pastContestsContainer = container.querySelector('.past-contests');
  pastContestsContainer.innerHTML = '';

  if (!contestHistory || contestHistory.length === 0) {
    pastContestsContainer.innerHTML = '<p class="no-data">No contest history available</p>';
    return;
  }

  const recentContests = contestHistory
    .filter(contest => contest.contest && contest.contest.title)
    .sort((a, b) => b.contest.startTime - a.contest.startTime)
    .slice(0, 5);

  recentContests.forEach(contest => {
    const contestItem = document.createElement('div');
    contestItem.className = 'activity-item';

    const contestTitle = document.createElement('div');
    contestTitle.className = 'problem-title';
    contestTitle.textContent = contest.contest.title;

    const contestResult = document.createElement('div');
    contestResult.className = 'activity-time';
    contestResult.textContent = contest.attended
      ? `Rank: ${contest.ranking} • Solved: ${contest.problemsSolved}/${contest.totalProblems}`
      : 'Not participated';

    contestItem.appendChild(contestTitle);
    contestItem.appendChild(contestResult);
    pastContestsContainer.appendChild(contestItem);
  });
}

function setupRemoveFriendButton(container, username) {
  const removeButton = container.querySelector('.remove-friend-btn');

  removeButton.addEventListener('click', async (event) => {
    event.stopPropagation();

    if (confirm(`Are you sure you want to remove ${username} from your friends list?`)) {
      try {
        const { friends = [] } = await chrome.storage.local.get('friends');

        const updatedFriends = friends.filter(friend => friend !== username);
        await chrome.storage.local.set({ friends: updatedFriends });

        renderFriendsList(updatedFriends);

        const friendDetailsContainer = document.getElementById('friend-details');
        const noFriendSelected = document.getElementById('no-friend-selected');
        friendDetailsContainer.style.display = 'none';
        noFriendSelected.style.display = 'block';

        showNotification(`${username} has been removed from your friends list.`, 'success');
      } catch (error) {
        console.error('Error removing friend:', error);
        showNotification('An error occurred while trying to remove the friend. Please try again.', 'error');
      }
    }
  });
}

// Event Handlers

async function addFriend() {
  const usernameInput = document.getElementById('username-input');
  const username = usernameInput.value.trim();
  if (!username) return;

  const { friends = [] } = await chrome.storage.local.get('friends');
  if (friends.includes(username)) {
    showNotification('Friend already added!', 'warning');
    return;
  }

  const addButton = document.getElementById('add-friend-btn');
  const originalText = addButton.textContent;
  addButton.textContent = 'Checking...';
  addButton.disabled = true;

  try {
    const userExists = await checkUserExists(username);
    if (!userExists) {
      showNotification(`User "${username}" does not exist on LeetCode.`, 'error');
      return;
    }

    const newFriends = [...friends, username];
    await chrome.storage.local.set({ friends: newFriends });
    usernameInput.value = '';
    renderFriendsList(newFriends);
    showNotification(`${username} added to your friends list!`, 'success');
  } catch (error) {
    console.error('Error adding friend:', error);
    showNotification('An error occurred. Please try again.', 'error');
  } finally {
    addButton.textContent = originalText;
    addButton.disabled = false;
  }
}

async function loadFriendDetails(username) {
  const friendDetailsContainer = document.getElementById('friend-details');
  const noFriendSelected = document.getElementById('no-friend-selected');

  noFriendSelected.style.display = 'none';
  friendDetailsContainer.style.display = 'block';
  friendDetailsContainer.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading ${username}'s data...</p>
    </div>
  `;

  const template = document.getElementById('friend-details-template').content;
  const container = document.importNode(template, true);

  try {
    const [profileData, problemsData, recentSubmissions, contestInfo] = await Promise.all([
      fetchFriendData(username),
      fetchProblemsSolvedData(username),
      fetchRecentSubmissions(username),
      fetchContestInfo(username),
    ]);

    const avatar = container.querySelector('.user-avatar');
    const usernameElement = container.querySelector('.username');
    usernameElement.innerHTML = `<a href="https://leetcode.com/u/${username}" target="_blank">${profileData.realName || username}</a>`;
    avatar.src = profileData.avatar;

    const contestRating = container.querySelector('.contest-rating');
    contestRating.textContent = contestInfo.currentRating
      ? `Rating: ${Math.round(contestInfo.currentRating)} (Top ${contestInfo.topPercentage}%)`
      : 'Rating: Not participated';

    if (contestInfo.badge) {
      contestRating.textContent += ` • ${contestInfo.badge}`;
    }

    const problemStats = container.querySelector('.problem-stats');
    const easySolved = problemsData.find(item => item.difficulty === 'Easy')?.count || 0;
    const mediumSolved = problemsData.find(item => item.difficulty === 'Medium')?.count || 0;
    const hardSolved = problemsData.find(item => item.difficulty === 'Hard')?.count || 0;

    problemStats.innerHTML = `
      <div class="difficulty-count easy">Easy: ${easySolved}</div>
      <div class="difficulty-count medium">Medium: ${mediumSolved}</div>
      <div class="difficulty-count hard">Hard: ${hardSolved}</div>
    `;

    updateRecentSubmissions(container, recentSubmissions);
    updatePastContests(container, contestInfo.contestHistory);

    setupRemoveFriendButton(container, username);

    friendDetailsContainer.innerHTML = '';
    friendDetailsContainer.appendChild(container);
  } catch (error) {
    friendDetailsContainer.innerHTML = '<p class="error">Failed to load friend details. Please try again.</p>';
  }
}

// Initialization

document.addEventListener('DOMContentLoaded', () => {
  const addFriendBtn = document.getElementById('add-friend-btn');
  addFriendBtn.addEventListener('click', addFriend);

  chrome.storage.local.get('friends', ({ friends = [] }) => {
    renderFriendsList(friends);
  });
});