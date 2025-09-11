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
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // Simple validation
        if (!email || !password) {
            showToast('Please fill in all fields', 'warning');
            return;
        }
        
        // Check if user exists
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(user));
            showMainApp(user);
            showToast('Login successful!', 'success');
        } else {
            showToast('Invalid email or password', 'danger');
        }
    });
    
    // Signup Form Submission
    document.getElementById('signupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        
        // Validation
        if (!name || !email || !password || !confirmPassword) {
            showToast('Please fill in all fields', 'warning');
            return;
        }
        
        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'warning');
            return;
        }
        
        // Check if user already exists
        const users = JSON.parse(localStorage.getItem('users')) || [];
        if (users.some(user => user.email === email)) {
            showToast('User with this email already exists', 'warning');
            return;
        }
        
        // Create new user
        const newUser = {
            id: Date.now(),
            name,
            email,
            password,
            connectedPlatforms: {}
        };
        
        // Save user
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        
        showMainApp(newUser);
        showToast('Account created successfully!', 'success');
    });
    
    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('authScreen').style.display = 'flex';
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
    }
    
    // Load connected platforms
    function loadConnectedPlatforms(user) {
        const connectedAccountsList = document.getElementById('connectedAccountsList');
        const accounts = connectedAccountsList.querySelectorAll('li');
        
        accounts.forEach(account => {
            const platform = account.querySelector('i').classList[1].replace('fa-', '');
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
        const statusIndicator = card.querySelector('.login-status');
        
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
        const users = JSON.parse(localStorage.getItem('users'));
        
        // Simulate connection process
        const connectBtn = card.querySelector('.connect-btn');
        const disconnectBtn = card.querySelector('.disconnect-btn');
        const statusIndicator = card.querySelector('.login-status');
        
        connectBtn.disabled = true;
        connectBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Connecting...';
        
        setTimeout(() => {
            // Update user data
            if (!currentUser.connectedPlatforms) {
                currentUser.connectedPlatforms = {};
            }
            currentUser.connectedPlatforms[platform] = true;
            
            // Update users array
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                users[userIndex] = currentUser;
            }
            
            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('users', JSON.stringify(users));
            
            // Update UI
            statusIndicator.classList.remove('logged-out');
            statusIndicator.classList.add('logged-in');
            connectBtn.style.display = 'none';
            disconnectBtn.style.display = 'inline-block';
            connectBtn.disabled = false;
            connectBtn.innerHTML = 'Connect';
            card.classList.add('connected');
            
            // Update account modal
            loadConnectedPlatforms(currentUser);
            
            showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully!`, 'success');
        }, 2000);
    }
    
    // Disconnect platform
    function disconnectPlatform(platform, card) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const users = JSON.parse(localStorage.getItem('users'));
        
        // Simulate disconnection process
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

        const formData = new FormData();
        formData.append('media', files[0]);

        try {
            uploadProgress.style.display = 'block';
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();
            uploadedMediaUrl = result.fileUrl;
            
            showMediaPreview(files[0]);
            showToast('File uploaded successfully!', 'success');
            
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Failed to upload file.', 'danger');
        } finally {
            uploadProgress.style.display = 'none';
        }
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
            
            response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showToast(editPostId.value ? 'Post updated successfully!' : 'Post scheduled successfully!', 'success');
                postForm.reset();
                selectAll.checked = false;
                editPostId.value = '';
                submitButton.innerHTML = '<i class="fas fa-calendar-plus me-2"></i>Schedule Post';
                cancelEdit.style.display = 'none';
                loadUpcomingPosts();
            } else {
                showToast('Error: ' + result.error, 'danger');
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
    async function loadUpcomingPosts() {
        try {
            const response = await fetch('/api/posts/upcoming');
            const posts = await response.json();
            
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
        }
    }
    
    // Function to edit a post
    async function editPost(postId) {
        try {
            const response = await fetch(`/api/posts/${postId}`);
            const post = await response.json();
            
            // Populate the form with post data
            document.getElementById('content').value = post.content;
            document.getElementById('mediaUrl').value = post.media_url || '';
            document.getElementById('scheduleTime').value = post.scheduled_for.substring(0, 16);
            
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
        } catch (error) {
            console.error('Error loading post for editing:', error);
            showToast('Failed to load post for editing', 'danger');
        }
    }
    
    // Function to delete a post
    async function deletePost(postId) {
        if (!confirm('Are you sure you want to delete this scheduled post?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/posts/delete/${postId}`, { method: 'DELETE' });
            const result = await response.json();
            
            if (response.ok) {
                showToast('Post deleted successfully', 'success');
                loadUpcomingPosts();
            } else {
                showToast('Error: ' + result.error, 'danger');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            showToast('Failed to delete post', 'danger');
        }
    }
    
    // Function to load recent activity
    async function loadRecentActivity() {
        try {
            const response = await fetch('/api/posts/recent');
            const activity = await response.json();
            
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

    // Load initial data if user is logged in
    if (currentUser) {
        loadUpcomingPosts();
        loadRecentActivity();
        
        // Set minimum datetime for schedule input to current time
        const now = new Date();
        const timezoneOffset = now.getTimezoneOffset() * 60000;
        const localISOTime = new Date(now - timezoneOffset).toISOString().slice(0, 16);
        document.getElementById('scheduleTime').min = localISOTime;
    }
});