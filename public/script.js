// Security enhancement: Password hashing
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Email validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Password validation
function validatePassword(password) {
    return password.length >= 8;
}

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        showMainApp(currentUser);
    }

    // Initialize Toast
    const toastEl = document.getElementById('liveToast');
    const toast = new bootstrap.Toast(toastEl);
    
    // Login Form Submission
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!validateEmail(email)) {
            showToast('Please enter a valid email address', 'warning');
            return;
        }
        
        if (!validatePassword(password)) {
            showToast('Password must be at least 8 characters long', 'warning');
            return;
        }
        
        try {
            const hashedPassword = await hashPassword(password);
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email === email && u.password === hashedPassword);
            
            if (user) {
                // Create a secure session token
                const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
                user.sessionToken = sessionToken;
                user.lastLogin = new Date().toISOString();
                
                localStorage.setItem('currentUser', JSON.stringify(user));
                localStorage.setItem('users', JSON.stringify(users));
                
                showMainApp(user);
                showToast('Login successful!', 'success');
            } else {
                showToast('Invalid email or password', 'danger');
            }
        } catch (error) {
            console.error('Login error:', error);
            showToast('Authentication error. Please try again.', 'danger');
        }
    });
    
    // Signup Form Submission
    document.getElementById('signupForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        
        if (!validateEmail(email)) {
            showToast('Please enter a valid email address', 'warning');
            return;
        }
        
        if (!validatePassword(password)) {
            showToast('Password must be at least 8 characters long', 'warning');
            return;
        }
        
        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'warning');
            return;
        }
        
        try {
            const hashedPassword = await hashPassword(password);
            const users = JSON.parse(localStorage.getItem('users')) || [];
            
            if (users.some(user => user.email === email)) {
                showToast('User with this email already exists', 'warning');
                return;
            }
            
            const newUser = {
                id: Date.now(),
                name,
                email,
                password: hashedPassword,
                connectedPlatforms: {},
                createdAt: new Date().toISOString(),
                sessionToken: Math.random().toString(36).substring(2) + Date.now().toString(36)
            };
            
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            
            showMainApp(newUser);
            showToast('Account created successfully!', 'success');
        } catch (error) {
            console.error('Signup error:', error);
            showToast('Registration error. Please try again.', 'danger');
        }
    });
    
    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('authScreen').style.display = 'flex';
        showToast('Logged out successfully', 'info');
    });
    
    // Test posts loading button
    document.getElementById('testPostsBtn')?.addEventListener('click', function() {
        loadUpcomingPosts();
        showToast('Testing posts loading...', 'info');
    });
    
    // Show main application
    function showMainApp(user) {
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        document.getElementById('userWelcome').textContent = `Welcome, ${user.name}!`;
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
        
        // Load connected platforms
        loadConnectedPlatforms(user);
        
        // Load data
        loadUpcomingPosts();
        loadRecentActivity();
        
        // Set minimum datetime for schedule input to current time
        const now = new Date();
        const timezoneOffset = now.getTimezoneOffset() * 60000;
        const localISOTime = new Date(now - timezoneOffset).toISOString().slice(0, 16);
        document.getElementById('scheduleTime').min = localISOTime;
    }
    
    // Load connected platforms
    function loadConnectedPlatforms(user) {
        const connectedAccountsList = document.getElementById('connectedAccountsList');
        const accounts = connectedAccountsList.querySelectorAll('li');
        
        accounts.forEach(account => {
            const platformIcon = account.querySelector('i');
            const platformClass = Array.from(platformIcon.classList).find(cls => cls.startsWith('fa-'));
            const platform = platformClass ? platformClass.replace('fa-', '') : '';
            const badge = account.querySelector('.badge');
            
            if (user.connectedPlatforms && user.connectedPlatforms[platform]) {
                badge.classList.remove('bg-danger');
                badge.classList.add('bg-success');
                badge.textContent = 'Connected';
            } else {
                badge.classList.remove('bg-success');
                badge.classList.add('bg-danger');
                badge.textContent = 'Not Connected';
            }
        });
        
        // Update platform cards
        updatePlatformCards(user);
    }
    
    // Update platform cards based on connection status
    function updatePlatformCards(user) {
        const platformCards = document.querySelectorAll('.login-platform');
        
        platformCards.forEach(card => {
            const platform = card.getAttribute('data-platform');
            const statusIndicator = card.querySelector('.login-status');
            const connectBtn = card.querySelector('.connect-btn');
            const disconnectBtn = card.querySelector('.disconnect-btn');
            
            if (user.connectedPlatforms && user.connectedPlatforms[platform]) {
                statusIndicator.classList.remove('logged-out');
                statusIndicator.classList.add('logged-in');
                connectBtn.style.display = 'none';
                disconnectBtn.style.display = 'inline-block';
                card.classList.add('connected');
            } else {
                statusIndicator.classList.remove('logged-in');
                statusIndicator.classList.add('logged-out');
                connectBtn.style.display = 'inline-block';
                disconnectBtn.style.display = 'none';
                card.classList.remove('connected');
            }
        });
    }
    
    // Platform connection handling
    document.querySelectorAll('.login-platform').forEach(card => {
        const connectBtn = card.querySelector('.connect-btn');
        const disconnectBtn = card.querySelector('.disconnect-btn');
        
        connectBtn.addEventListener('click', function() {
            const platform = card.getAttribute('data-platform');
            connectPlatform(platform, card);
        });
        
        disconnectBtn.addEventListener('click', function() {
            const platform = card.getAttribute('data-platform');
            disconnectPlatform(platform, card);
        });
    });
    
    // Connect platform
    function connectPlatform(platform, card) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            showToast('Please log in first', 'warning');
            return;
        }
        
        const connectBtn = card.querySelector('.connect-btn');
        const disconnectBtn = card.querySelector('.disconnect-btn');
        const statusIndicator = card.querySelector('.login-status');
        
        // Show authentication popup for TikTok
        if (platform === 'tiktok') {
            const email = prompt('Enter your TikTok email:');
            const password = prompt('Enter your TikTok password:');
            
            if (!email || !password) {
                showToast('TikTok authentication canceled', 'warning');
                return;
            }
            
            // Simulate authentication process
            connectBtn.disabled = true;
            connectBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Connecting...';
            
            setTimeout(() => {
                // Update UI for successful connection
                statusIndicator.classList.remove('logged-out');
                statusIndicator.classList.add('logged-in');
                connectBtn.style.display = 'none';
                disconnectBtn.style.display = 'inline-block';
                card.classList.add('connected');
                
                // Update user data
                if (!currentUser.connectedPlatforms) {
                    currentUser.connectedPlatforms = {};
                }
                currentUser.connectedPlatforms[platform] = {
                    connected: true,
                    email: email,
                    connectedAt: new Date().toISOString()
                };
                
                // Update users array
                const users = JSON.parse(localStorage.getItem('users')) || [];
                const userIndex = users.findIndex(u => u.id === currentUser.id);
                if (userIndex !== -1) {
                    users[userIndex] = currentUser;
                }
                
                // Save to localStorage
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                localStorage.setItem('users', JSON.stringify(users));
                
                // Update account modal
                loadConnectedPlatforms(currentUser);
                
                showToast(`TikTok connected successfully as ${email}!`, 'success');
                connectBtn.disabled = false;
            }, 2000);
        } else {
            // For other platforms, use the existing simulation
            connectBtn.disabled = true;
            connectBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Connecting...';
            
            setTimeout(() => {
                // Update UI for successful connection
                statusIndicator.classList.remove('logged-out');
                statusIndicator.classList.add('logged-in');
                connectBtn.style.display = 'none';
                disconnectBtn.style.display = 'inline-block';
                card.classList.add('connected');
                
                // Update user data
                if (!currentUser.connectedPlatforms) {
                    currentUser.connectedPlatforms = {};
                }
                currentUser.connectedPlatforms[platform] = {
                    connected: true,
                    connectedAt: new Date().toISOString()
                };
                
                // Update users array
                const users = JSON.parse(localStorage.getItem('users')) || [];
                const userIndex = users.findIndex(u => u.id === currentUser.id);
                if (userIndex !== -1) {
                    users[userIndex] = currentUser;
                }
                
                // Save to localStorage
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                localStorage.setItem('users', JSON.stringify(users));
                
                // Update account modal
                loadConnectedPlatforms(currentUser);
                
                showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully!`, 'success');
                connectBtn.disabled = false;
            }, 2000);
        }
    }
    
    // Disconnect platform
    function disconnectPlatform(platform, card) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const users = JSON.parse(localStorage.getItem('users'));
        
        const connectBtn = card.querySelector('.connect-btn');
        const disconnectBtn = card.querySelector('.disconnect-btn');
        const statusIndicator = card.querySelector('.login-status');
        
        disconnectBtn.disabled = true;
        disconnectBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Disconnecting...';
        
        setTimeout(() => {
            // Update user data
            if (currentUser.connectedPlatforms && currentUser.connectedPlatforms[platform]) {
                delete currentUser.connectedPlatforms[platform];
            }
            
            // Update users array
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                users[userIndex] = currentUser;
            }
            
            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('users', JSON.stringify(users));
            
            // Update UI
            statusIndicator.classList.remove('logged-in');
            statusIndicator.classList.add('logged-out');
            connectBtn.style.display = 'inline-block';
            disconnectBtn.style.display = 'none';
            disconnectBtn.disabled = false;
            disconnectBtn.innerHTML = 'Disconnect';
            card.classList.remove('connected');
            
            // Update account modal
            loadConnectedPlatforms(currentUser);
            
            showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected successfully!`, 'success');
        }, 1500);
    }
    
    // Select All functionality
    const selectAll = document.getElementById('selectAll');
    const platformChecks = document.querySelectorAll('.platform-check');
    
    selectAll.addEventListener('change', function() {
        platformChecks.forEach(check => {
            check.checked = selectAll.checked;
        });
    });
    
    // File Upload Handling
    const mediaFileInput = document.getElementById('mediaFile');
    const uploadButton = document.getElementById('uploadButton');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const mediaPreview = document.getElementById('mediaPreview');
    const previewContainer = document.getElementById('previewContainer');
    const removeMediaButton = document.getElementById('removeMedia');
    const mediaUrlInput = document.getElementById('mediaUrl');

    let uploadedMediaUrl = '';

    // Function to handle file upload
    uploadButton.addEventListener('click', async () => {
        const files = mediaFileInput.files;
        if (files.length === 0) {
            showToast('Please select a file to upload.', 'warning');
            return;
        }

        // Simulate upload process
        uploadProgress.style.display = 'block';
        
        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            progressBar.style.width = `${progress}%`;
            progressBar.textContent = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    uploadedMediaUrl = URL.createObjectURL(files[0]);
                    showMediaPreview(files[0]);
                    showToast('File uploaded successfully!', 'success');
                    uploadProgress.style.display = 'none';
                }, 300);
            }
        }, 100);
    });

    // Function to show media preview
    function showMediaPreview(file) {
        mediaPreview.style.display = 'block';
        previewContainer.innerHTML = '';
        
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.style.maxWidth = '100%';
            img.style.maxHeight = '200px';
            previewContainer.appendChild(img);
        } else if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.controls = true;
            video.style.maxWidth = '100%';
            video.style.maxHeight = '200px';
            previewContainer.appendChild(video);
        } else {
            previewContainer.innerHTML = `<p>File: ${file.name}</p>`;
        }
    }

    // Remove media handler
    removeMediaButton.addEventListener('click', () => {
        mediaPreview.style.display = 'none';
        mediaFileInput.value = '';
        mediaUrlInput.value = '';
        uploadedMediaUrl = '';
    });

    // Form submission
    const postForm = document.getElementById('postForm');
    const editPostId = document.getElementById('editPostId');
    const submitButton = document.getElementById('submitButton');
    const cancelEdit = document.getElementById('cancelEdit');
    
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const content = document.getElementById('content').value;
        const mediaUrl = uploadedMediaUrl || document.getElementById('mediaUrl').value;
        const scheduledFor = document.getElementById('scheduleTime').value;
        
        // Get selected platforms
        const selectedPlatforms = [];
        document.querySelectorAll('.platform-check:checked').forEach(checkbox => {
            selectedPlatforms.push(checkbox.value);
        });
        
        if (selectedPlatforms.length === 0) {
            showToast('Please select at least one platform.', 'warning');
            return;
        }
        
        if (!scheduledFor) {
            showToast('Please select a date and time for scheduling.', 'warning');
            return;
        }
        
        const postData = {
            content,
            media_url: mediaUrl,
            scheduled_for: scheduledFor,
            platforms: selectedPlatforms
        };
        
        try {
            let response;
            let url = '/api/posts/schedule';
            let method = 'POST';
            
            if (editPostId.value) {
                // Update existing post
                url = '/api/posts/update';
                method = 'PUT';
                postData.id = editPostId.value;
            }
            
            // For demo purposes, we'll simulate the API response
            // In a real app, you would use fetch to call your API
            const result = {success: true, id: Date.now()};
            
            if (result.success) {
                showToast(editPostId.value ? 'Post updated successfully!' : 'Post scheduled successfully!', 'success');
                postForm.reset();
                selectAll.checked = false;
                editPostId.value = '';
                submitButton.innerHTML = '<i class="fas fa-calendar-plus me-2"></i>Schedule Post';
                cancelEdit.style.display = 'none';
                
                // Add the new post to local storage for demonstration
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                if (currentUser) {
                    if (!currentUser.posts) currentUser.posts = [];
                    currentUser.posts.push({
                        id: result.id,
                        content,
                        media_url: mediaUrl,
                        scheduled_for: scheduledFor,
                        platforms: selectedPlatforms,
                        created_at: new Date().toISOString()
                    });
                    
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
                    // Update users array
                    const users = JSON.parse(localStorage.getItem('users')) || [];
                    const userIndex = users.findIndex(u => u.id === currentUser.id);
                    if (userIndex !== -1) {
                        users[userIndex] = currentUser;
                        localStorage.setItem('users', JSON.stringify(users));
                    }
                }
                
                loadUpcomingPosts();
            } else {
                showToast('Error: ' + (result.error || 'Unknown error'), 'danger');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to schedule post. Please try again.', 'danger');
        }
    });
    
    // Cancel edit handler
    cancelEdit.addEventListener('click', () => {
        postForm.reset();
        editPostId.value = '';
        selectAll.checked = false;
        submitButton.innerHTML = '<i class="fas fa-calendar-plus me-2"></i>Schedule Post';
        cancelEdit.style.display = 'none';
        mediaPreview.style.display = 'none';
    });
    
    // Refresh posts handler
    document.getElementById('refreshPosts').addEventListener('click', () => {
        loadUpcomingPosts();
        showToast('Posts refreshed', 'info');
    });
    
    // Function to show toast messages
    function showToast(message, type = 'info') {
        const toastMessage = document.getElementById('toastMessage');
        toastMessage.textContent = message;
        
        toastEl.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning', 'text-bg-info');
        
        switch(type) {
            case 'success':
                toastEl.classList.add('text-bg-success');
                break;
            case 'danger':
                toastEl.classList.add('text-bg-danger');
                break;
            case 'warning':
                toastEl.classList.add('text-bg-warning');
                break;
            default:
                toastEl.classList.add('text-bg-info');
        }
        
        toast.show();
    }
    
    // Function to load upcoming posts
    function loadUpcomingPosts() {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            const posts = currentUser?.posts || [];
            
            const upcomingPostsContainer = document.getElementById('upcomingPosts');
            
            if (posts.length === 0) {
                upcomingPostsContainer.innerHTML = `
                    <div class="text-center text-muted">
                        <i class="fas fa-inbox fa-2x mb-2"></i>
                        <p>No scheduled posts</p>
                    </div>
                `;
                return;
            }
            
            let html = '<div class="w-100">';
            posts.forEach(post => {
                const date = new Date(post.scheduled_for).toLocaleString();
                html += `
                    <div class="post-item p-3 border-bottom mb-2">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between mb-1">
                                    <strong>${date}</strong>
                                    <div class="post-actions">
                                        <button class="btn btn-sm btn-outline-primary me-1 edit-post" data-id="${post.id}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger delete-post" data-id="${post.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <p class="mb-2">${post.content}</p>
                                <div>
                                    ${post.platforms.map(platform => {
                                        let icon = '';
                                        let color = '';
                                        switch(platform) {
                                            case 'facebook_profile':
                                            case 'facebook_page':
                                            case 'facebook_group':
                                                icon = 'facebook';
                                                color = 'primary';
                                                break;
                                            case 'instagram':
                                                icon = 'instagram';
                                                color = 'danger';
                                                break;
                                            case 'twitter':
                                                icon = 'twitter';
                                                color = 'info';
                                                break;
                                            case 'linkedin':
                                                icon = 'linkedin';
                                                color = 'primary';
                                                break;
                                            case 'youtube':
                                                icon = 'youtube';
                                                color = 'danger';
                                                break;
                                            case 'tiktok':
                                                icon = 'tiktok';
                                                color = 'dark';
                                                break;
                                            case 'whatsapp':
                                                icon = 'whatsapp';
                                                color = 'success';
                                                break;
                                            default:
                                                icon = 'share-alt';
                                                color = 'secondary';
                                        }
                                        return `<span class="badge bg-${color} platform-badge"><i class="fab fa-${icon} me-1"></i>${platform.split('_')[0]}</span>`;
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            
            upcomingPostsContainer.innerHTML = html;
            
            // Add event listeners to edit and delete buttons
            document.querySelectorAll('.edit-post').forEach(button => {
                button.addEventListener('click', function() {
                    const postId = this.getAttribute('data-id');
                    editPost(postId);
                });
            });
            
            document.querySelectorAll('.delete-post').forEach(button => {
                button.addEventListener('click', function() {
                    const postId = this.getAttribute('data-id');
                    deletePost(postId);
                });
            });
        } catch (error) {
            console.error('Error loading upcoming posts:', error);
            const upcomingPostsContainer = document.getElementById('upcomingPosts');
            upcomingPostsContainer.innerHTML = `
                <div class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <p>Failed to load scheduled posts</p>
                    <button class="btn btn-sm btn-primary" onclick="loadUpcomingPosts()">Retry</button>
                </div>
            `;
        }
    }
    
    // Function to edit a post
    function editPost(postId) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const post = currentUser.posts.find(p => p.id == postId);
        
        if (!post) {
            showToast('Post not found', 'danger');
            return;
        }
        
        // Populate the form with post data
        document.getElementById('content').value = post.content;
        document.getElementById('mediaUrl').value = post.media_url || '';
        
        // Format date for datetime-local input
        const scheduledFor = new Date(post.scheduled_for);
        const timezoneOffset = scheduledFor.getTimezoneOffset() * 60000;
        const localISOTime = new Date(scheduledFor - timezoneOffset).toISOString().slice(0, 16);
        document.getElementById('scheduleTime').value = localISOTime;
        
        // Check the platforms
        document.querySelectorAll('.platform-check').forEach(checkbox => {
            checkbox.checked = post.platforms.includes(checkbox.value);
        });
        
        // Set the edit mode
        editPostId.value = postId;
        submitButton.innerHTML = '<i class="fas fa-save me-2"></i>Update Post';
        cancelEdit.style.display = 'block';
        
        // Scroll to form
        document.getElementById('postForm').scrollIntoView({ behavior: 'smooth' });
        
        showToast('Post loaded for editing', 'info');
    }
    
    // Function to delete a post
    function deletePost(postId) {
        if (!confirm('Are you sure you want to delete this scheduled post?')) {
            return;
        }
        
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            const users = JSON.parse(localStorage.getItem('users')) || [];
            
            // Remove the post
            currentUser.posts = currentUser.posts.filter(p => p.id != postId);
            
            // Update users array
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                users[userIndex] = currentUser;
            }
            
            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('users', JSON.stringify(users));
            
            showToast('Post deleted successfully', 'success');
            loadUpcomingPosts();
        } catch (error) {
            console.error('Error deleting post:', error);
            showToast('Failed to delete post', 'danger');
        }
    }
    
    // Function to load recent activity
    function loadRecentActivity() {
        try {
            // For demo purposes, we'll use sample data
            const activity = [
                {
                    content: 'Posted: Summer sale is live!',
                    posted_at: new Date(Date.now() - 3600000).toISOString()
                },
                {
                    content: 'Posted: New blog article published',
                    posted_at: new Date(Date.now() - 86400000).toISOString()
                }
            ];
            
            const activityContainer = document.getElementById('recentActivity');
            
            if (activity.length === 0) {
                activityContainer.innerHTML = `
                    <div class="text-center text-muted">
                        <i class="fas fa-history fa-2x mb-2"></i>
                        <p>No recent activity</p>
                    </div>
                `;
                return;
            }
            
            let html = '<div class="w-100">';
            activity.forEach(item => {
                const date = new Date(item.posted_at).toLocaleString();
                html += `
                    <div class="border-bottom pb-2 mb-2">
                        <div class="d-flex justify-content-between">
                            <strong>${date}</strong>
                            <span class="badge bg-success">Posted</span>
                        </div>
                        <p class="mb-1 text-truncate">${item.content}</p>
                    </div>
                `;
            });
            html += '</div>';
            
            activityContainer.innerHTML = html;
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }
});