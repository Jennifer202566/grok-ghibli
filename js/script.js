// 等待 DOM 完全加载后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取 DOM 元素
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const originalPreview = document.getElementById('original-preview');
    const resultPreview = document.getElementById('result-preview');
    const changeImageBtn = document.getElementById('change-image-btn');
    const downloadBtn = document.getElementById('download-btn');
    const loading = document.getElementById('loading');
    
    // 初始状态：显示上传区域，隐藏预览容器和加载动画
    previewContainer.style.display = 'none';
    loading.style.display = 'none';
    
    // 点击上传区域触发文件选择
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // 拖拽文件到上传区域
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
    
    // 文件选择变化时处理上传
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFileUpload(fileInput.files[0]);
        }
    });
    
    // 更换图片按钮
    changeImageBtn.addEventListener('click', () => {
        previewContainer.style.display = 'none';
        uploadArea.style.display = 'block';
    });
    
    // 下载按钮
    downloadBtn.addEventListener('click', () => {
        if (resultPreview.src) {
            downloadImage(resultPreview.src);
        }
    });
    
    // 处理文件上传
    function handleFileUpload(file) {
        // 检查文件类型
        if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
            alert('请上传 JPG 或 PNG 格式的图片');
            return;
        }
        
        // 检查文件大小（最大 5MB）
        if (file.size > 5 * 1024 * 1024) {
            alert('图片大小不能超过 5MB');
            return;
        }
        
        // 显示原始图片预览
        const reader = new FileReader();
        reader.onload = async (e) => {
            originalPreview.src = e.target.result;
            uploadArea.style.display = 'none';
            loading.style.display = 'block';
            
            try {
                // 将图片转换为 base64
                const base64Image = e.target.result.split(',')[1];
                
                // 调用 API 端点进行图像转换
                const response = await fetch('/api/convert', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image: base64Image
                    })
                });
                
                // 检查响应状态
                if (!response.ok) {
                    let errorMessage = `网络响应异常，状态码: ${response.status}`;
                    try {
                        const errorData = await response.json();
                        if (errorData.error) {
                            errorMessage = errorData.error;
                        }
                    } catch (e) {
                        console.error('无法解析错误响应:', e);
                    }
                    throw new Error(errorMessage);
                }
                
                // 解析响应数据
                const data = await response.json();
                
                // 显示转换后的图片
                resultPreview.src = data.outputImage;
                loading.style.display = 'none';
                previewContainer.style.display = 'block';
                
            } catch (error) {
                console.error('图像转换错误:', error);
                alert('图片转换失败。请重试。错误: ' + error.message);
                loading.style.display = 'none';
                previewContainer.style.display = 'block';
            }
        };
        
        reader.readAsDataURL(file);
    }
    
    // 下载图片函数
    function downloadImage(url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = 'ghibli-style-image.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // FAQ 交互
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            item.classList.toggle('active');
        });
    });
    
    // 移动菜单交互
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    if (mobileMenu) {
        mobileMenu.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
    
    // 平滑滚动到锚点
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // 减去导航栏高度
                    behavior: 'smooth'
                });
                
                // 如果在移动设备上，点击后关闭菜单
                if (window.innerWidth < 768 && navLinks.classList.contains('active')) {
                    mobileMenu.classList.remove('active');
                    navLinks.classList.remove('active');
                }
            }
        });
    });
    
    // 页面加载时检查 URL 哈希并滚动到相应部分
    window.addEventListener('load', () => {
        if (window.location.hash) {
            const targetElement = document.querySelector(window.location.hash);
            if (targetElement) {
                setTimeout(() => {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }, 100);
            }
        }
    });
});
