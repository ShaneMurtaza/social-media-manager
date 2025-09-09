document.addEventListener('DOMContentLoaded', function() {
    // Initialize Toast
    const toastEl = document.getElementById('liveToast');
    const toast = new bootstrap.Toast(toastEl);
    
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
            const response = await fetch('/api/posts/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showToast('Post scheduled successfully!', 'success');
                postForm.reset();
                selectAll.checked = false;
                loadUpcomingPosts();
            } else {
                showToast('Error: ' + result.error, 'danger');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to schedule post. Please try again.', 'danger');
        }
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
                    <div class="border-bottom pb-2 mb-2">
                        <div class="d-flex justify-content-between">
                            <strong>${date}</strong>
                            <span class="badge bg-primary">${post.platforms.length} platforms</span>
                        </div>
                        <p class="mb-1 text-truncate">${post.content}</p>
                    </div>
                `;
            });
            html += '</div>';
            
            upcomingPostsContainer.innerHTML = html;
        } catch (error) {
            console.error('Error loading upcoming posts:', error);
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

    // Load initial data
    loadUpcomingPosts();
    loadRecentActivity();
    
    // Set minimum datetime for schedule input to current time
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now - timezoneOffset).toISOString().slice(0, 16);
    document.getElementById('scheduleTime').min = localISOTime;
});