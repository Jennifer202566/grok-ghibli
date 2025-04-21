/**
 * 吉卜力风格图片转换器的主要JavaScript文件
 * 处理图片上传、预览和转换
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const originalPreview = document.getElementById('original-preview');
    const resultPreview = document.getElementById('result-preview');
    const changeImageBtn = document.getElementById('change-image-btn');
    const downloadBtn = document.getElementById('download-btn');
    const loadingElement = document.getElementById('loading');
    const faqItems = document.querySelectorAll('.faq-item');
    
    // 移动端菜单切换
    if (mobileMenu) {
        mobileMenu.addEventListener('click', function() {
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
    
    // 平滑滚动锚点链接
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // 如果移动菜单打开，关闭它
                if (mobileMenu && mobileMenu.classList.contains('active')) {
                    mobileMenu.classList.remove('active');
                    navLinks.classList.remove('active');
                }
                
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // 文件上传处理
    if (uploadArea && fileInput) {
        // 点击上传区域
        uploadArea.addEventListener('click', function() {
            fileInput.click();
        });
        
        // 拖放功能
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('active');
        });
        
        uploadArea.addEventListener('dragleave', function() {
            this.classList.remove('active');
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('active');
            
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                handleFile(e.dataTransfer.files[0]);
            }
        });
        
        // 文件输入变化
        fileInput.addEventListener('change', function() {
            if (this.files.length) {
                handleFile(this.files[0]);
            }
        });
        
        // 处理选择的文件
        function handleFile(file) {
            // 验证文件类型
            const validTypes = ['image/jpeg', 'image/png'];
            if (!validTypes.includes(file.type)) {
                showError('请上传有效的图片文件（JPG或PNG）。');
                return;
            }
            
            // 验证文件大小（5MB上限）
            if (file.size > 5 * 1024 * 1024) {
                showError('文件大小超过5MB。请上传更小的图片。');
                return;
            }
            
            // 读取并显示文件
            const reader = new FileReader();
            reader.onload = function(e) {
                originalPreview.src = e.target.result;
                
                // 显示加载动画
                uploadArea.style.display = 'none';
                loadingElement.style.display = 'block';
                
                // 创建FormData对象
                const formData = new FormData();
                formData.append('image', file);
                
                console.log('发送图片到服务器进行处理...');
                
                // 发送到后端API
                fetch('/api/transform', {
                    method: 'POST',
                    body: formData
                })
                .then(response => {
                    console.log('收到服务器响应，状态码:', response.status);
                    if (!response.ok) {
                        throw new Error('网络响应异常，状态码: ' + response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('处理响应数据:', data);
                    
                    // 确保返回了结果URL
                    if (!data.resultImageUrl) {
                        throw new Error('服务器未返回结果图片URL');
                    }
                    
                    // 添加时间戳防止缓存
                    const resultUrl = data.resultImageUrl + '?t=' + new Date().getTime();
                    console.log('设置结果图片URL:', resultUrl);
                    
                    // 显示结果
                    resultPreview.src = resultUrl;
                    resultPreview.onload = function() {
                        console.log('结果图片加载完成');
                        loadingElement.style.display = 'none';
                        previewContainer.style.display = 'block';
                    };
                    
                    resultPreview.onerror = function() {
                        console.error('结果图片加载失败');
                        showError('结果图片加载失败。请重试。');
                        loadingElement.style.display = 'none';
                        uploadArea.style.display = 'block';
                    };
                })
                .catch(error => {
                    console.error('处理过程中出错:', error);
                    showError('图片转换失败。请重试。错误: ' + error.message);
                    loadingElement.style.display = 'none';
                    uploadArea.style.display = 'block';
                });
            };
            reader.readAsDataURL(file);
        }
        
        // 更换图片按钮
        if (changeImageBtn) {
            changeImageBtn.addEventListener('click', function() {
                previewContainer.style.display = 'none';
                uploadArea.style.display = 'block';
                fileInput.value = '';
            });
        }
        
        // 下载按钮
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function() {
                if (resultPreview.src && resultPreview.src !== window.location.href) {
                    const link = document.createElement('a');
                    link.href = resultPreview.src;
                    link.download = 'ghibli-style-image.jpg';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    showError('没有可下载的图片。');
                }
            });
        }
    }
    
    // FAQ手风琴
    if (faqItems.length) {
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            
            question.addEventListener('click', function() {
                // 关闭其他项目
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // 切换当前项目
                item.classList.toggle('active');
            });
        });
    }
    
    // 显示错误的辅助函数
    function showError(message) {
        alert(message);
        console.error('错误:', message);
    }
});

// 延迟加载图片
document.addEventListener('DOMContentLoaded', function() {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const image = entry.target;
                    image.src = image.dataset.src || image.src;
                    observer.unobserve(image);
                }
            });
        });
        
        lazyImages.forEach(img => imageObserver.observe(img));
    } else {
        // 对不支持IntersectionObserver的浏览器的回退
        lazyImages.forEach(img => {
            img.src = img.dataset.src || img.src;
        });
    }
});
