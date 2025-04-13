class ChatSystem {
    constructor(game) {
        this.game = game;
        this.messages = [];
        this.initialized = false;
        this.commonEmojis = ['👍', '❤️', '😄', '🎮', '🚀', '⭐', '🔥', '👏', '💫', '✨'];
        this.isVisible = true; // Start with chat visible

        // Wait for socket to be ready before initializing
        const initInterval = setInterval(() => {
            if (this.game.multiplayerManager && this.game.multiplayerManager.socket) {
                clearInterval(initInterval);
                this.initialize();
            }
        }, 100);
    }

    initialize() {
        if (this.initialized) return;
        this.initialized = true;

        this.createChatInterface();
        this.setupSocketHandlers();
        
        // Show a welcome message to help users understand how to use chat
        setTimeout(() => {
            this.addMessage({
                id: 'welcome-message',
                player_id: 'system',
                player_name: 'System',
                text: 'Welcome to the chat! Type a message and press Enter to send. Click the emoji button to add reactions.',
                time: Date.now(),
                reactions: {}
            });
        }, 1000);
        
        console.log('Chat system initialized successfully');
    }

    createChatInterface() {
        this.container = document.createElement('div');
        this.container.className = 'chat-container';
        this.container.innerHTML = `
            <div class="chat-header">
                <span>Game Chat</span>
                <div class="chat-controls">
                    <button class="btn btn-sm btn-outline-light help-button" title="Chat Help">?</button>
                    <button class="btn btn-sm btn-outline-light toggle-button" onclick="game.chatSystem.toggleChat()">
                        <span class="minimize-icon">−</span>
                    </button>
                </div>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input">
                <input type="text" placeholder="Type a message..." />
                <button class="btn btn-sm btn-outline-primary emoji-trigger" title="Add emoji">😀</button>
                <div class="emoji-picker" style="display: none;">
                    ${this.commonEmojis.map(emoji => 
                        `<button class="emoji-button btn btn-sm">${emoji}</button>`
                    ).join('')}
                </div>
            </div>
            <div class="chat-help" style="display: none;">
                <h5>Chat Commands:</h5>
                <ul>
                    <li>Press Enter to send a message</li>
                    <li>Click 😀 to add emojis</li>
                    <li>Click + on messages to add reactions</li>
                    <li>Messages are visible to all players</li>
                </ul>
                <button class="btn btn-sm btn-secondary close-help">Close</button>
            </div>
        `;

        document.body.appendChild(this.container);
        this.messagesContainer = this.container.querySelector('.chat-messages');
        this.input = this.container.querySelector('input');
        this.chatHelp = this.container.querySelector('.chat-help');
        
        // Add a pulsing notification to make the chat more noticeable
        this.addChatNotification();
        
        this.setupEventListeners();
    }
    
    addChatNotification() {
        const notification = document.createElement('div');
        notification.className = 'chat-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span>New Chat System Available!</span>
                <span class="notification-close">×</span>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Auto-remove notification after 8 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 1000);
        }, 8000);
        
        // Allow manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 1000);
        });
    }

    setupEventListeners() {
        try {
            // Message input event
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && this.input.value.trim()) {
                    this.sendMessage(this.input.value.trim());
                    this.input.value = '';
                    
                    // Play a subtle sound effect when sending a message
                    if (this.game.soundManager && this.game.soundManager.initialized) {
                        // Create a quick UI feedback for sending message
                        const feedbackEl = document.createElement('div');
                        feedbackEl.className = 'message-sent-feedback';
                        feedbackEl.textContent = 'Message Sent';
                        this.container.appendChild(feedbackEl);
                        
                        // Animate and remove
                        setTimeout(() => {
                            feedbackEl.classList.add('fade-out');
                            setTimeout(() => feedbackEl.remove(), 500);
                        }, 1000);
                    }
                }
            });

            // Emoji picker events
            const emojiTrigger = this.container.querySelector('.emoji-trigger');
            const emojiPicker = this.container.querySelector('.emoji-picker');

            emojiTrigger.addEventListener('click', () => {
                emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'grid' : 'none';
                // Add animation class when showing
                if (emojiPicker.style.display === 'grid') {
                    emojiPicker.classList.add('emoji-picker-animated');
                }
            });

            // Close emoji picker when clicking outside
            document.addEventListener('click', (e) => {
                if (!emojiPicker.contains(e.target) && !emojiTrigger.contains(e.target)) {
                    emojiPicker.style.display = 'none';
                }
            });

            // Setup emoji buttons
            this.container.querySelectorAll('.emoji-button').forEach(button => {
                button.addEventListener('click', () => {
                    this.input.value += button.textContent;
                    this.input.focus();
                    emojiPicker.style.display = 'none';
                    
                    // Add pulse animation to the button when clicked
                    button.classList.add('emoji-pulse');
                    setTimeout(() => button.classList.remove('emoji-pulse'), 500);
                });
            });
            
            // Help button functionality
            const helpButton = this.container.querySelector('.help-button');
            const helpPanel = this.container.querySelector('.chat-help');
            const closeHelp = this.container.querySelector('.close-help');
            
            helpButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event from bubbling up
                helpPanel.style.display = helpPanel.style.display === 'none' ? 'block' : 'none';
                if (helpPanel.style.display === 'block') {
                    helpPanel.classList.add('help-panel-animated');
                }
            });
            
            closeHelp.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event from bubbling up
                helpPanel.style.display = 'none';
            });
            
            // Make sure help panel doesn't intercept clicks on the game
            helpPanel.addEventListener('click', (e) => {
                e.stopPropagation(); // Contain clicks within the help panel
            });
            
            // Add some interactivity to the chat UI
            this.container.addEventListener('mouseenter', () => {
                this.container.classList.add('chat-container-highlight');
            });
            
            this.container.addEventListener('mouseleave', () => {
                this.container.classList.remove('chat-container-highlight');
            });
            
        } catch (error) {
            console.error('Error setting up chat event listeners:', error);
        }
    }

    setupSocketHandlers() {
        try {
            if (!this.game.multiplayerManager || !this.game.multiplayerManager.socket) {
                console.error('Socket not available for chat system');
                return;
            }

            this.game.multiplayerManager.socket.on('new_chat_message', (message) => {
                message.reactions = message.reactions || {};
                this.addMessage(message);
            });

            this.game.multiplayerManager.socket.on('reaction_update', (data) => {
                this.updateReactions(data.message_id, data.reactions || {});
            });
        } catch (error) {
            console.error('Error setting up chat socket handlers:', error);
        }
    }

    sendMessage(text) {
        try {
            if (!this.game.multiplayerManager || !this.game.multiplayerManager.socket) {
                console.error('Socket not available for sending message');
                return;
            }
            this.game.multiplayerManager.socket.emit('chat_message', { text });
        } catch (error) {
            console.error('Error sending chat message:', error);
        }
    }

    addMessage(message) {
        try {
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message message-animated';
            messageElement.dataset.messageId = message.id;

            const isSystem = message.player_id === 'system';
            const isCurrentPlayer = !isSystem && message.player_id === this.game.multiplayerManager.socket.id;
            
            // Different styling for system messages vs player messages
            if (isSystem) {
                messageElement.classList.add('system-message');
            } else if (isCurrentPlayer) {
                messageElement.classList.add('own-message');
            } else {
                messageElement.classList.add('other-message');
            }
            
            // Format player name for display
            const playerName = isSystem ? 'System' : 
                              (isCurrentPlayer ? 'You' : 
                              (message.player_name || `Player ${message.player_id.substr(0, 4)}`));
            
            messageElement.innerHTML = `
                <div class="message-content">
                    <strong class="player-name">${playerName}</strong>
                    <span class="message-text">${this.escapeHtml(message.text)}</span>
                </div>
                <div class="message-reactions">
                    ${this.renderReactions(message.reactions)}
                    ${!isSystem ? '<button class="reaction-button add-reaction">+</button>' : ''}
                </div>
            `;

            // Only setup reaction button for non-system messages
            if (!isSystem) {
                this.setupReactionButton(messageElement, message.id);
            }
            
            // Insert the new message at the top
            this.messagesContainer.insertBefore(messageElement, this.messagesContainer.firstChild);
            this.messages.push(message);
            
            // If chat is minimized, add a notification indicator
            if (this.container.querySelector('.chat-messages').style.display === 'none') {
                const notifyBadge = document.createElement('div');
                notifyBadge.className = 'chat-notification-badge';
                notifyBadge.textContent = '1';
                
                // Remove existing badge if present
                const existingBadge = this.container.querySelector('.chat-notification-badge');
                if (existingBadge) {
                    existingBadge.remove();
                }
                
                this.container.querySelector('.chat-header').appendChild(notifyBadge);
                
                // Add header pulse animation
                const header = this.container.querySelector('.chat-header');
                header.classList.add('header-pulse');
                setTimeout(() => header.classList.remove('header-pulse'), 300);
                
                // Add container highlight
                this.container.classList.add('chat-container-highlight');
                setTimeout(() => this.container.classList.remove('chat-container-highlight'), 1500);
            }
            
            // Add enhanced animation to the message
            setTimeout(() => {
                messageElement.classList.add('message-visible');
                
                // Add a special animation for system messages
                if (isSystem) {
                    messageElement.style.borderLeftWidth = '6px';
                    setTimeout(() => {
                        messageElement.style.borderLeftWidth = '3px';
                        messageElement.style.transition = 'border-left-width 0.5s ease-in-out';
                    }, 400);
                }
                
                // Add a special animation for messages from the current player
                if (isCurrentPlayer) {
                    messageElement.style.transform = 'translateY(0) scale(1.03)';
                    setTimeout(() => {
                        messageElement.style.transform = 'translateY(0) scale(1)';
                        messageElement.style.transition = 'transform 0.3s ease-in-out';
                    }, 300);
                }
            }, 50);
            
        } catch (error) {
            console.error('Error adding chat message:', error);
        }
    }

    setupReactionButton(messageElement, messageId) {
        const addReactionBtn = messageElement.querySelector('.add-reaction');
        addReactionBtn.addEventListener('click', () => {
            const emojiPicker = document.createElement('div');
            emojiPicker.className = 'emoji-picker';
            emojiPicker.style.position = 'absolute';
            emojiPicker.innerHTML = this.commonEmojis.map(emoji => 
                `<button class="emoji-button btn btn-sm">${emoji}</button>`
            ).join('');

            const rect = addReactionBtn.getBoundingClientRect();
            emojiPicker.style.left = rect.left + 'px';
            emojiPicker.style.top = (rect.top - 100) + 'px';

            document.body.appendChild(emojiPicker);

            const cleanup = () => {
                document.body.removeChild(emojiPicker);
                document.removeEventListener('click', outsideClickHandler);
            };

            const outsideClickHandler = (e) => {
                if (!emojiPicker.contains(e.target)) {
                    cleanup();
                }
            };

            emojiPicker.querySelectorAll('.emoji-button').forEach(button => {
                button.addEventListener('click', () => {
                    this.addReaction(messageId, button.textContent);
                    cleanup();
                });
            });

            setTimeout(() => {
                document.addEventListener('click', outsideClickHandler);
            }, 0);
        });
    }

    updateReactions(messageId, reactions) {
        try {
            const messageElement = this.container.querySelector(`[data-message-id="${messageId}"]`);
            if (messageElement) {
                const reactionsContainer = messageElement.querySelector('.message-reactions');
                reactionsContainer.innerHTML = this.renderReactions(reactions) + 
                    '<button class="reaction-button add-reaction">+</button>';
                this.setupReactionButton(messageElement, messageId);
            }
        } catch (error) {
            console.error('Error updating reactions:', error);
        }
    }

    renderReactions(reactions) {
        try {
            if (!reactions) return '';
            return Object.entries(reactions)
                .map(([emoji, users]) => `
                    <button class="reaction-button">
                        ${emoji}<span class="reaction-count">${users.length}</span>
                    </button>
                `).join('');
        } catch (error) {
            console.error('Error rendering reactions:', error);
            return '';
        }
    }

    addReaction(messageId, emoji) {
        try {
            if (!this.game.multiplayerManager || !this.game.multiplayerManager.socket) {
                console.error('Socket not available for adding reaction');
                return;
            }
            
            // Create a temporary visual effect to show the emoji being added
            const messageElement = this.container.querySelector(`[data-message-id="${messageId}"]`);
            if (messageElement) {
                const floatingEmoji = document.createElement('div');
                floatingEmoji.className = 'floating-emoji';
                floatingEmoji.textContent = emoji;
                
                // Position near the message
                const rect = messageElement.getBoundingClientRect();
                floatingEmoji.style.left = `${rect.left + rect.width / 2}px`;
                floatingEmoji.style.top = `${rect.top}px`;
                
                // Add to DOM and animate
                document.body.appendChild(floatingEmoji);
                
                // Start animation
                setTimeout(() => {
                    floatingEmoji.classList.add('emoji-pulse');
                    
                    // Remove after animation completes
                    setTimeout(() => {
                        floatingEmoji.remove();
                    }, 1000);
                }, 10);
                
                // Also add a subtle highlight to the message
                messageElement.classList.add('message-reaction-added');
                setTimeout(() => {
                    messageElement.classList.remove('message-reaction-added');
                }, 1000);
            }
            
            // Send the reaction to the server
            this.game.multiplayerManager.socket.emit('add_reaction', {
                message_id: messageId,
                emoji: emoji
            });
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    }

    toggleChat() {
        try {
            const messagesEl = this.container.querySelector('.chat-messages');
            const inputEl = this.container.querySelector('.chat-input');
            const minimizeIcon = this.container.querySelector('.minimize-icon');
            const helpPanel = this.container.querySelector('.chat-help');

            if (messagesEl.style.display === 'none') {
                // Expanding the chat
                messagesEl.style.display = 'flex';
                inputEl.style.display = 'flex';
                minimizeIcon.textContent = '−';
                
                // Add transition for smoother height change
                this.container.classList.add('chat-expanding');
                this.container.style.height = '400px';
                
                // Always hide help panel when expanding chat to prevent overlap
                helpPanel.classList.remove('help-panel-animated');
                helpPanel.style.display = 'none';
                
                // Remove any notification badges
                const badge = this.container.querySelector('.chat-notification-badge');
                if (badge) {
                    badge.classList.add('fade-out');
                    setTimeout(() => badge.remove(), 300);
                }
                
                // Focus the input for immediate typing
                setTimeout(() => {
                    this.input.focus();
                    this.container.classList.remove('chat-expanding');
                }, 300);
            } else {
                // Collapsing the chat
                messagesEl.style.display = 'none';
                inputEl.style.display = 'none';
                minimizeIcon.textContent = '+';
                
                // Always hide help panel when collapsing
                helpPanel.classList.remove('help-panel-animated');
                helpPanel.style.display = 'none';
                
                // Add transition for smoother height change
                this.container.classList.add('chat-collapsing');
                this.container.style.height = 'auto';
                
                setTimeout(() => {
                    this.container.classList.remove('chat-collapsing');
                }, 300);
            }
            
            // Play a subtle animation on the chat header
            const header = this.container.querySelector('.chat-header');
            header.classList.add('header-pulse');
            setTimeout(() => header.classList.remove('header-pulse'), 300);
            
        } catch (error) {
            console.error('Error toggling chat:', error);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}