// API interaction layer for fetching LeetCode user data, submissions, contest history, and profile information

export async function fetchFriendData(username) {
    const query = `
      query userPublicProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            userAvatar
            realName
          }
        }
      }
    `;
  
    const variables = { username };
  
    try {
      const response = await fetch('https://leetcode.com/graphql/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });
  
      const result = await response.json();
      if (result.data && result.data.matchedUser) {
        const user = result.data.matchedUser;
        return {
          username: user.username,
          avatar: user.profile.userAvatar,
          realName: user.profile.realName,
        };
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
}
  
export async function fetchProblemsSolvedData(username) {
    const query = `
      query userProblemsSolved($username: String!) {
        matchedUser(username: $username) {
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
      }
    `;
  
    const variables = { username };
  
    try {
      const response = await fetch('https://leetcode.com/graphql/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });
  
      const result = await response.json();
      if (result.data && result.data.matchedUser) {
        return result.data.matchedUser.submitStatsGlobal.acSubmissionNum.map(item => ({
          difficulty: item.difficulty,
          count: item.count,
        }));
      } else {
        throw new Error('No problem data available');
      }
    } catch (error) {
      console.error('Error fetching problems solved data:', error);
      throw error;
    }
}
  
export async function fetchRecentSubmissions(username, limit = 5) {
    const query = `
      query recentAcSubmissions($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
          id
          title
          titleSlug
          timestamp
        }
      }
    `;
  
    const variables = { username, limit };
  
    try {
      const response = await fetch('https://leetcode.com/graphql/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });
  
      const result = await response.json();
      if (result.data && result.data.recentAcSubmissionList) {
        return result.data.recentAcSubmissionList.map(submission => ({
          id: submission.id,
          title: submission.title,
          titleSlug: submission.titleSlug,
          timestamp: new Date(parseInt(submission.timestamp) * 1000).toLocaleString(),
        }));
      } else {
        throw new Error('No recent submissions found');
      }
    } catch (error) {
      console.error('Error fetching recent submissions:', error);
      throw error;
    }
}
  
export async function fetchContestInfo(username) {
    const query = `
      query userContestRankingInfo($username: String!) {
        userContestRanking(username: $username) {
          attendedContestsCount
          rating
          topPercentage
          badge {
            name
          }
        }
        userContestRankingHistory(username: $username) {
          attended
          problemsSolved
          totalProblems
          ranking
          contest {
            title
            startTime
          }
        }
      }
    `;
  
    const variables = { username };
  
    try {
      const response = await fetch('https://leetcode.com/graphql/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });
  
      const result = await response.json();
      return {
        currentRating: result.data.userContestRanking?.rating,
        topPercentage: result.data.userContestRanking?.topPercentage,
        attendedCount: result.data.userContestRanking?.attendedContestsCount,
        badge: result.data.userContestRanking?.badge?.name,
        contestHistory: result.data.userContestRankingHistory || [],
      };
    } catch (error) {
      console.error('Error fetching contest info:', error);
      throw error;
    }
}
  
export async function checkUserExists(username) {
    const query = `
      query userPublicProfile($username: String!) {
        matchedUser(username: $username) {
          username
        }
      }
    `;
  
    const variables = { username };
  
    try {
      const response = await fetch('https://leetcode.com/graphql/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });
  
      const result = await response.json();
      return !!(result.data && result.data.matchedUser);
    } catch (error) {
      console.error('Error checking if user exists:', error);
      return false;
    }
}