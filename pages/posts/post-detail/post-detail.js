/* 12-11 实现不同页面进入播放背景音乐不同，刚进入默认不播放 
  用上面这几行代码在app.js中设置全局变量
  模拟器清空缓存：开发者工具-缓存-清除数据存储/清除文件存储
  缓存清除API：wx.clearStorage（在页面中写一个按钮绑定这个清除事件）
  template页面中最好用绝对路径引入图片，如/images/icon/chat.png
*/
var postsData = require('../../../data/posts-data.js')
var app = getApp();
Page({
    data: {
        isPlayingMusic: false
    },
    onLoad: function(option) {
        var postId = option.id;
        console.log(postId);
        this.data.currentPostId = postId;
        var postData = postsData.postList[postId];
        this.setData({
            postData: postData
        })

        var postsCollected = wx.getStorageSync('posts_collected')
        if (postsCollected[postId]) {
            var postCollected = postsCollected[postId]
            this.setData({
                collected: postCollected
            })
        } else {
            var postsCollected = {};
            postsCollected[postId] = false;
            wx.setStorageSync('posts_collected', postsCollected);
        }

        if (app.globalData.g_isPlayingMusic && app.globalData.g_currentMusicPostId === postId) {
            this.setData({
                isPlayingMusic: true
            })
        }
        this.setMusicMonitor();
    },

    //判断app中globalData的值来判断播放状态
    setMusicMonitor: function() {
        var that = this;
        wx.onBackgroundAudioPlay(function(event) {
            var pages = getCurrentPages();
            var currentPage = pages[pages.length - 1];
            console.log(currentPage);
            if (currentPage.data.currentPostId === that.data.currentPostId) {
                if (app.globalData.g_currentMusicPostId == that.data.currentPostId) {
                    that.setData({ isPlayingMusic: true })
                }
            }
            app.globalData.g_isPlayingMusic = true;
        });
        wx.onBackgroundAudioPause(function(event) {
            var pages = getCurrentPages();
            var currentPage = pages[pages.length - 1];
            if (currentPage.data.currentPostId === that.data.currentPostId) {
                if (app.globalData.g_currentMusicPostId == that.data.currentPostId) {
                    that.setData({ isPlayingMusic: false })
                }
            }
            app.globalData.g_isPlayingMusic = false;
            // app.globalData.g_currentMusicPostId = null;
        });
        wx.onBackgroundAudioStop(function() {
            that.setData({ isPlayingMusic: false })
            app.globalData.g_isPlayingMusic = false;
            // app.globalData.g_currentMusicPostId = null;
        });
    },

    onColletionTap: function(event) {
        // this.getPostsCollectedSyc();
        this.getPostsCollectedAsy();
    },

    getPostsCollectedAsy: function(event) {
        var that = this;
        wx.getStorage({
            key: "posts_collected",
            success: function(res) {
                var postsCollected = res.data;
                var postCollected = postsCollected[that.data.currentPostId];
                // 收藏变成未收藏，未收藏变成收藏
                postCollected = !postCollected;
                postsCollected[that.data.currentPostId] = postCollected;
                that.showToast(postsCollected, postCollected); //12-6 调用时记得传入参数
            }
        })
    },

    getPostsCollectedSyc: function() {
        var postsCollected = wx.getStorageSync('posts_collected');
        var postCollected = postsCollected[this.data.currentPostId];
        // 收藏变成未收藏，未收藏变成收藏
        postCollected = !postCollected;
        postsCollected[this.data.currentPostId] = postCollected;
        this.showToast(postsCollected, postCollected); //12-6 调用时记得传入参数
        //12-6 因为showToast也是page结构体下的一个属性，所以这里要用this来调用
    },

    showModal: function(postsCollected, postCollected) {
        var that = this;
        wx.showModal({
            title: "收藏",
            content: postCollected ? "收藏该文章？" : "取消收藏该文章？",
            showCancel: "true",
            cancelText: "取消",
            cancelColor: "#333",
            confirmText: "确认",
            confirmColor: "#405f80",
            success: function(res) {
                if (res.confirm) {
                    wx.setStorageSync('posts_collected', postsCollected);
                    that.setData({
                        collected: postCollected
                    })
                }
            }
        })
    },

    showToast: function(postsCollected, postCollected) {
        wx.setStorageSync('posts_collected', postsCollected);
        this.setData({
            collected: postCollected
        })
        wx.showToast({
            title: postCollected ? "收藏成功" : "取消成功",
            duration: 1000,
            icon: "success"
        })
    },

    onShareTap: function(event) {
        var itemList = [
            "分享给微信好友",
            "分享到朋友圈",
            "分享到QQ",
            "分享到微博"
        ];
        wx.showActionSheet({
            itemList: itemList,
            itemColor: "#405f80",
            success: function(res) {
                wx.showModal({
                    title: "用户 " + itemList[res.tapIndex],
                    content: "用户是否取消？" + res.cancel + "现在无法实现分享功能，什么时候能支持呢"
                })
            }
        })
    },

    onMusicTap: function(event) {
        var currentPostId = this.data.currentPostId;
        var postData = postsData.postList[currentPostId];
        var isPlayingMusic = this.data.isPlayingMusic;
        if (isPlayingMusic) {
            wx.pauseBackgroundAudio();
            this.setData({ isPlayingMusic: false })
                // app.globalData.g_currentMusicPostId = null;
            app.globalData.g_isPlayingMusic = false;
        } else {
            wx.playBackgroundAudio({
                dataUrl: postData.music.url,
                title: postData.music.title,
                coverImgUrl: postData.music.coverImg,
            })
            this.setData({
                isPlayingMusic: true
            })
            app.globalData.g_currentMusicPostId = this.data.currentPostId;
            app.globalData.g_isPlayingMusic = true;
        }
    },

    /* 定义页面分享函数*/
    onShareAppMessage: function(event) {
        return {
            title: '离思五首·其四',
            desc: '曾经沧海难为水，除却巫山不是云',
            path: '/pages/posts/post-detail/post-detail?id=0'
        }
    }

})