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

    // 在 HTML 中添加一个测试按钮
// <button id="test-upload-btn" style="margin-top: 10px;">测试图像上传</button>

// 在 script.js 中添加测试按钮的事件处理
document.addEventListener('DOMContentLoaded', function() {
    // ... 现有代码 ...
    
    // 添加测试按钮事件处理
    const testUploadBtn = document.getElementById('test-upload-btn');
    if (testUploadBtn) {
        testUploadBtn.addEventListener('click', function() {
            if (fileInput.files.length) {
                testImageUpload(fileInput.files[0]);
            } else {
                alert('请先选择一张图片');
            }
        });
    }
    
    // ... 现有代码 ...
});

// 测试图像上传函数
function testImageUpload(file) {
    // 检查文件类型
    if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        alert('请上传 JPG 或 PNG 格式的图片');
        return;
    }
    
    // 检查文件大小
    if (file.size > 1 * 1024 * 1024) {
        alert('图片大小不能超过 1MB');
        return;
    }
    
    // 显示原始图片预览
    const reader = new FileReader();
    reader.onload = function(e) {
        // 创建图像对象以获取尺寸
        const img = new Image();
        img.onload = function() {
            // 强制调整图像尺寸
            const maxDimension = 512;
            let width = img.width;
            let height = img.height;
            
            // 计算新尺寸，保持宽高比
            if (width > height) {
                height = Math.round(height * (maxDimension / width));
                width = maxDimension;
            } else {
                width = Math.round(width * (maxDimension / height));
                height = maxDimension;
            }
            
            // 创建画布并调整图像大小
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            
            // 获取调整大小后的图像数据
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            
            // 提取 base64 数据
            const base64Image = imageData.split(',')[1];
            
            // 调用测试 API
            fetch('/api/test-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: base64Image
                })
            })
            .then(response => response.json())
            .then(data => {
                alert(`测试成功！图像大小: ${data.imageSize}`);
                console.log('测试结果:', data);
            })
            .catch(error => {
                console.error('测试错误:', error);
                alert('测试失败: ' + error.message);
            });
        };
        
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}
    
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
    
// 在 handleFileUpload 函数中添加更严格的图像预处理
function handleFileUpload(file) {
    // 检查文件类型
    if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        alert('请上传 JPG 或 PNG 格式的图片');
        return;
    }
    
    // 检查文件大小（最大 1MB，更小）
    if (file.size > 1 * 1024 * 1024) {
        alert('图片大小不能超过 1MB');
        return;
    }
    
    // 显示原始图片预览
    const reader = new FileReader();
    reader.onload = function(e) {
        // 创建图像对象以获取尺寸
        const img = new Image();
        img.onload = function() {
            // 强制调整图像尺寸，无论原始尺寸如何
            const maxDimension = 512; // 更小的最大尺寸
            let width = img.width;
            let height = img.height;
            
            // 计算新尺寸，保持宽高比
            if (width > height) {
                height = Math.round(height * (maxDimension / width));
                width = maxDimension;
            } else {
                width = Math.round(width * (maxDimension / height));
                height = maxDimension;
            }
            
            // 创建画布并调整图像大小
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF'; // 白色背景
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            
            // 获取调整大小后的图像数据，使用较低的质量
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            
            // 显示图像预览
            originalPreview.src = imageData;
            uploadArea.style.display = 'none';
            loading.style.display = 'block';
            
            // 提取 base64 数据
            const base64Image = imageData.split(',')[1];
            
            // 调用 API
            fetch('/api/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: base64Image
                })
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.error || `网络响应异常，状态码: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                resultPreview.src = data.outputImage;
                loading.style.display = 'none';
                previewContainer.style.display = 'block';
            })
            .catch(error => {
                console.error('图像转换错误:', error);
                alert('图片转换失败。请重试。错误: ' + error.message);
                loading.style.display = 'none';
                previewContainer.style.display = 'block';
            });
        };
        
        img.src = e.target.result;
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
