import { Authenticator } from "./authenticator.js";
import { Section, SectionManager } from "./section.js";

export const SECTION = new Section(`<div class="menu">
	<div class="menu-friends">
		<div class="menu-friends-container">
			<div class="menu-friends-header">
				<p>FRIENDS</p>
			</div>
			<hr class="friends-divider">
			<div id="friendsOnline" class="friends-online">
				<div class="friends-online-header">
					<p>ONLINE</p>
				</div>
				<ul id="friendsOnlineList" class="friends-online-list"></ul>
				<hr class="friends-divider">
			</div>
			<div id="friendsOffline" class="friends-offline">
				<div class="friends-offline-header">
					<p>OFFLINE</p>
				</div>
				<ul id="friendsOfflineList" class="friends-offline-list"></ul>
				<hr class="friends-divider">
			</div>
			<div class="friends-options">
				<div class="friends-options-add">
					<button id="friendsOptionsAddButton">ADD FRIEND</button>
					<span id="friendsOptionsAlert">&#11044</span>
				</div>
			</div>
		</div>
	</div>
	<div class="menu-gamemodes">
		<div class="menu-item" id="menuItemLocal">
			<h1>Local</h1>
			<p>Play local - alone or with a friend<p>
		</div>  
		<div class="menu-item" id="menuItemOnline">
			<h1>Online</h1>
			<p>Play 1 vs 1 with a friend<p>
		</div>
		<div class="menu-item" id="menuItemTournament">
			<h1>Tournament</h1>
			<p>Play an exciting Tournament<p>
		</div>
		<div class="menu-item" id="menuItemMultiplayer">
			<h1>Multiplayer</h1>
			<p>Play online in multiplayer mode<p>
		</div>
		<div class="menu-item" id="menuItemDashboard">
			<h1>Dashboard</h1>
			<p>Check your game stats<p>
		</div>
	</div>
	<div class="modal" id="friendsAddModal">
		<div class="modal-content">
			<span class="close-button" id="closeModal1Button">&times;</span>
			<div class="friends-add-header">
				<p>ADD A FRIEND</p>
			</div>
			<hr class="friends-add-divider1">
			<div class="friends-add-input-container">
				<input type="text" id="friendUsername" placeholder="Enter username">
				<button id="sendInvitationButton">INVITE</button>
			</div>

			<div id="invitationMessage" class="invitation-message"></div>

			<div class="friends-add-lists">
			<div id="friendsRequests" class="friends-add-list-item">
				<div class="friends-add-list-header">
					<p>REQUESTS</p>
				</div>
				<hr class="friends-add-divider2">
				<ul id="friendsRequestsList" class="friends-add-list"></ul>
			</div>
				<div id="friendsPending" class="friends-add-list-item">
					<div class="friends-add-list-header">
						<p>PENDING</p>
					</div>
					<hr class="friends-add-divider2">
					<ul id="friendsPendingList" class="friends-add-list"></ul>
				</div>
				<div id="friendsBlocked" class="friends-add-list-item">
					<div class="friends-add-list-header">
						<p>BLOCKED</p>
					</div>
					<hr class="friends-add-divider2">
					<ul id="friendsBlockedList" class="friends-add-list"></ul>
				</div>
			</div>

		</div>
	</div>
	
	<div class="modal-modify" id="friendsModifyModal">
		<div class="modal-content-modify">
			<span class="close-button" id="closeFriendsModifyModalButton">&times;</span>
			<div class="friends-add-header">
				<p>MODIFY FRIENDSHIP</p>
			</div>
			<hr class="friends-add-divider3">

			<div class="friends-modify-username">
				<p>FRIEND: </p>
				<p id="friendsModifyModalUsername"></p>
			</div>

			<div class="friends-modify-button">
				<button id="removeFriendButton">REMOVE FRIEND</button>
			</div>
			
			<div class="friends-modify-button">
			<button id="acceptFriendButton">ACCEPT FRIEND REQUEST</button>
			</div>
			
			<div class="friends-modify-button">
			<button id="denyFriendButton">DENY FRIEND REQUEST</button>
			</div>
			
			<div class="friends-modify-button">
			<button id="withdrawFriendButton">WITHDRAW FRIEND REQUEST</button>
			</div>
			
			<div class="friends-modify-button">
			<button id="unblockFriendButton">UNBLOCK USER</button>
			</div>

			<div class="friends-modify-button">
			<button id="showUserProfile">USER PROFILE</button>
			</div>
			
			<div class="friends-modify-button">
				<button id="blockFriendButton">BLOCK USER</button>
			</div>

		</div>
	</div>
</div>
`, true);

SECTION.loadSection = async () => {
	console.log('IN MENU!');
};
