-- =========================================================
-- RoomEase: A Web-Based Boarding House Information and
-- Listing System — Full database export (React + AdminLTE version)
-- =========================================================
-- Target: WAMP64 (MySQL 8.0+ or MariaDB 10.4+)
--
-- Based on the schema of the PHP version (Hanzoo123/Roomease), plus the
-- tables the React app needs: reviews, conversations, messages,
-- notifications and contact_messages. Comes with demo data so the
-- AdminLTE admin panel has something to show.
--
-- Import: phpMyAdmin > Import > choose this file > Go
--     or: mysql -u root < database/roomease.sql
-- It creates the `roomease` database if needed.
--
-- WARNING: drops and recreates every table. Existing data is lost.
-- =========================================================

CREATE DATABASE IF NOT EXISTS roomease
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE roomease;

-- Foreign key checks off, so the tables can be dropped in any order.
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS account_notes;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS admin_actions;
DROP TABLE IF EXISTS site_settings;
DROP TABLE IF EXISTS login_attempts;
DROP TABLE IF EXISTS remember_tokens;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS boarding_house_utilities;
DROP TABLE IF EXISTS boarding_house_amenities;
DROP TABLE IF EXISTS utilities;
DROP TABLE IF EXISTS amenities;
DROP TABLE IF EXISTS room_types;
DROP TABLE IF EXISTS boarding_houses;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;


-- =========================================================
-- ACCOUNTS
-- =========================================================

-- ---------------------------------------------------------
-- 1. users
-- Admins, landlords and boarders. Removing an account sets deleted_at
-- instead of deleting the row, so its listings and photos are kept.
-- ---------------------------------------------------------
CREATE TABLE users (
    user_id         INT AUTO_INCREMENT PRIMARY KEY,
    -- Empty only for a new admin, until their first sign-in.
    email           VARCHAR(150) NULL,
    -- Admins only: sign in with this or the email.
    username        VARCHAR(30) NULL DEFAULT NULL,
    google_id       VARCHAR(64) DEFAULT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    middle_name     VARCHAR(100) NULL DEFAULT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone_number    VARCHAR(30) DEFAULT NULL,
    -- Profile photo path. NULL shows initials instead.
    avatar_path     VARCHAR(255) NULL DEFAULT NULL,
    -- super_admin: an administrator who can also manage other admins and
    -- read the activity log. Both admin roles sign in to backend/admin
    -- (AdminLTE); landlords and boarders use the React app.
    role            ENUM('super_admin', 'administrator', 'landlord', 'boarder') NOT NULL,
    -- 1 = temporary password set by a super admin; must be changed.
    must_change_password TINYINT(1) NOT NULL DEFAULT 0,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    -- Why an admin deactivated the account (shown in the admin panel).
    deactivation_reason VARCHAR(500) NULL DEFAULT NULL,
    last_login_at   DATETIME NULL DEFAULT NULL,
    deleted_at      DATETIME NULL DEFAULT NULL,
    deleted_by      INT NULL,
    -- Who created / last changed it. NULL = the system.
    created_by      INT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by      INT NULL,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY email (email),
    UNIQUE KEY uq_users_username (username),
    UNIQUE KEY uq_users_google_id (google_id),
    -- Account lists filter on these three together.
    KEY idx_users_live (deleted_at, is_active, role),
    CONSTRAINT fk_users_created_by FOREIGN KEY (created_by)
        REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by)
        REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_users_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- LISTINGS
-- =========================================================

-- ---------------------------------------------------------
-- 2. boarding_houses
-- A listing, owned by one landlord. Rent, type and capacity are per room.
-- Only 'approved' listings are public. Removing sets deleted_at (restorable).
-- ---------------------------------------------------------
CREATE TABLE boarding_houses (
    boarding_house_id   INT AUTO_INCREMENT PRIMARY KEY,
    landlord_id         INT NOT NULL,
    name                VARCHAR(150) NOT NULL,
    address             TEXT NOT NULL,
    -- Area of Baybay City used by the browse filter (Poblacion, San Isidro,
    -- Baybay City Center, Near VSU).
    area                VARCHAR(60) NOT NULL DEFAULT 'Poblacion',
    moderation_status   ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    rejection_reason    VARCHAR(500) DEFAULT NULL,
    -- When it last went into the review queue (new, or resubmitted after changes).
    submitted_at        TIMESTAMP NULL DEFAULT NULL,
    moderated_at        TIMESTAMP NULL DEFAULT NULL,
    moderated_by        INT DEFAULT NULL,
    description         TEXT DEFAULT NULL,
    contact_number      VARCHAR(50) DEFAULT NULL,
    -- One rule per line.
    house_rules         TEXT DEFAULT NULL,
    -- Stay terms and map pin. NULL = not stated.
    curfew              VARCHAR(60) DEFAULT NULL,
    minimum_stay_months TINYINT UNSIGNED DEFAULT NULL,
    -- Comma-separated, e.g. 'Cash,GCash'.
    payment_methods     VARCHAR(100) DEFAULT NULL,
    gender_policy       ENUM('any', 'female', 'male') DEFAULT NULL,
    visitors_allowed    TINYINT(1) DEFAULT NULL,
    pets_allowed        TINYINT(1) DEFAULT NULL,
    cooking_allowed     TINYINT(1) DEFAULT NULL,
    latitude            DECIMAL(9, 6) DEFAULT NULL,
    longitude           DECIMAL(9, 6) DEFAULT NULL,
    -- Room-page visits, for the landlord's analytics.
    views               INT UNSIGNED NOT NULL DEFAULT 0,
    -- Who created / last changed it.
    created_by          INT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by          INT NULL,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at          DATETIME NULL DEFAULT NULL,
    -- Who removed it (an admin, or the landlord), and the admin's reason.
    deleted_by          INT NULL,
    removal_reason      VARCHAR(500) DEFAULT NULL,
    -- For browse: filter by status, sort by date.
    KEY idx_bh_public_recent   (moderation_status, created_at),
    KEY idx_bh_created         (created_at),
    KEY idx_bh_landlord_recent (landlord_id, created_at),
    KEY idx_bh_deleted         (deleted_at),
    KEY idx_bh_area            (area),
    CONSTRAINT fk_bh_landlord FOREIGN KEY (landlord_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_bh_moderated_by FOREIGN KEY (moderated_by)
        REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_bh_created_by FOREIGN KEY (created_by)
        REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_bh_updated_by FOREIGN KEY (updated_by)
        REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_bh_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 3. room_types
-- The room types the room form and browse filter offer.
-- ---------------------------------------------------------
CREATE TABLE room_types (
    room_type_id    INT AUTO_INCREMENT PRIMARY KEY,
    room_type_name  VARCHAR(50) NOT NULL,
    created_by      INT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by      INT NULL,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY room_type_name (room_type_name),
    CONSTRAINT fk_room_types_created_by FOREIGN KEY (created_by)
        REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_room_types_updated_by FOREIGN KEY (updated_by)
        REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 4. amenities
-- landlord_id NULL = made by the admin, usable by all landlords.
-- Otherwise only that landlord can use it.
-- ---------------------------------------------------------
CREATE TABLE amenities (
    amenity_id      INT AUTO_INCREMENT PRIMARY KEY,
    landlord_id     INT DEFAULT NULL,
    amenity_name    VARCHAR(100) NOT NULL,
    created_by      INT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by      INT NULL,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_amenities_owner_name (landlord_id, amenity_name),
    CONSTRAINT fk_amenities_landlord FOREIGN KEY (landlord_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_amenities_created_by FOREIGN KEY (created_by)
        REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_amenities_updated_by FOREIGN KEY (updated_by)
        REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 5. utilities
-- Same ownership rule as amenities.
-- ---------------------------------------------------------
CREATE TABLE utilities (
    utility_id      INT AUTO_INCREMENT PRIMARY KEY,
    landlord_id     INT DEFAULT NULL,
    utility_name    VARCHAR(100) NOT NULL,
    created_by      INT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by      INT NULL,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_utilities_owner_name (landlord_id, utility_name),
    CONSTRAINT fk_utilities_landlord FOREIGN KEY (landlord_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_utilities_created_by FOREIGN KEY (created_by)
        REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_utilities_updated_by FOREIGN KEY (updated_by)
        REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 6. boarding_house_amenities
-- Which amenities a listing offers (many-to-many).
-- ---------------------------------------------------------
CREATE TABLE boarding_house_amenities (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    boarding_house_id   INT NOT NULL,
    amenity_id          INT NOT NULL,
    UNIQUE KEY uq_bh_amenity (boarding_house_id, amenity_id),
    CONSTRAINT fk_bha_bh FOREIGN KEY (boarding_house_id)
        REFERENCES boarding_houses(boarding_house_id) ON DELETE CASCADE,
    CONSTRAINT fk_bha_amenity FOREIGN KEY (amenity_id)
        REFERENCES amenities(amenity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 7. boarding_house_utilities
-- Which utilities a listing bills for, and how (many-to-many).
-- ---------------------------------------------------------
CREATE TABLE boarding_house_utilities (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    boarding_house_id   INT NOT NULL,
    utility_id          INT NOT NULL,
    billing_policy      VARCHAR(150) DEFAULT NULL,
    UNIQUE KEY uq_bh_utility (boarding_house_id, utility_id),
    CONSTRAINT fk_bhu_bh FOREIGN KEY (boarding_house_id)
        REFERENCES boarding_houses(boarding_house_id) ON DELETE CASCADE,
    CONSTRAINT fk_bhu_utility FOREIGN KEY (utility_id)
        REFERENCES utilities(utility_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 8. rooms
-- Availability is not stored: it comes from is_open, capacity and slots_taken.
-- RESTRICT: a room type in use can't be deleted.
-- ---------------------------------------------------------
CREATE TABLE rooms (
    room_id             INT AUTO_INCREMENT PRIMARY KEY,
    boarding_house_id   INT NOT NULL,
    name                VARCHAR(60) NOT NULL,
    room_type_id        INT NOT NULL,
    monthly_rent        DECIMAL(10, 2) NOT NULL,
    capacity            SMALLINT NOT NULL DEFAULT 1,
    slots_taken         SMALLINT NOT NULL DEFAULT 0,
    is_open             TINYINT(1) NOT NULL DEFAULT 1,
    description         VARCHAR(500) DEFAULT NULL,
    created_by          INT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by          INT NULL,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_rooms_house_name (boarding_house_id, name),
    KEY idx_rooms_type_rent (room_type_id, is_open, monthly_rent),
    CONSTRAINT chk_rooms_capacity CHECK (capacity BETWEEN 1 AND 100),
    CONSTRAINT chk_rooms_slots CHECK (slots_taken >= 0 AND slots_taken <= capacity),
    CONSTRAINT fk_rooms_bh FOREIGN KEY (boarding_house_id)
        REFERENCES boarding_houses(boarding_house_id) ON DELETE CASCADE,
    CONSTRAINT fk_rooms_type FOREIGN KEY (room_type_id)
        REFERENCES room_types(room_type_id) ON DELETE RESTRICT,
    CONSTRAINT fk_rooms_created_by FOREIGN KEY (created_by)
        REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_rooms_updated_by FOREIGN KEY (updated_by)
        REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 9. images
-- room_id NULL = a house photo. is_primary = the cover (or a room's main
-- photo). The files are in assets/uploads/; only the path is stored.
-- ---------------------------------------------------------
CREATE TABLE images (
    image_id            INT AUTO_INCREMENT PRIMARY KEY,
    boarding_house_id   INT NOT NULL,
    room_id             INT DEFAULT NULL,
    image_path          VARCHAR(255) NOT NULL,
    is_primary          TINYINT(1) NOT NULL DEFAULT 0,
    created_by          INT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by          INT NULL,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- For finding each listing's cover photo.
    KEY idx_images_cover (boarding_house_id, is_primary, image_id),
    KEY idx_images_room  (room_id, is_primary, image_id),
    CONSTRAINT fk_images_bh FOREIGN KEY (boarding_house_id)
        REFERENCES boarding_houses(boarding_house_id) ON DELETE CASCADE,
    CONSTRAINT fk_images_room FOREIGN KEY (room_id)
        REFERENCES rooms(room_id) ON DELETE CASCADE,
    CONSTRAINT fk_images_created_by FOREIGN KEY (created_by)
        REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_images_updated_by FOREIGN KEY (updated_by)
        REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 10. favorites
-- Listings a boarder saved. The unique key stops duplicates.
-- ---------------------------------------------------------
CREATE TABLE favorites (
    favorite_id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT NOT NULL,
    boarding_house_id   INT NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_favorite (user_id, boarding_house_id),
    -- A user's saved list, newest first.
    KEY idx_fav_user_recent (user_id, created_at),
    CONSTRAINT fk_fav_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_fav_bh FOREIGN KEY (boarding_house_id)
        REFERENCES boarding_houses(boarding_house_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 11. reservations
-- A boarder's request for one room, which the landlord accepts or declines.
-- A request, not a payment: any fee is settled with the landlord directly.
-- Accepting takes one of the room's slots (rooms.slots_taken).
-- ---------------------------------------------------------
CREATE TABLE reservations (
    reservation_id      INT AUTO_INCREMENT PRIMARY KEY,
    room_id             INT NOT NULL,
    boarder_id          INT NOT NULL,
    move_in_date        DATE NOT NULL,
    message             VARCHAR(500) DEFAULT NULL,
    status              ENUM('pending', 'accepted', 'declined', 'cancelled') NOT NULL DEFAULT 'pending',
    -- The landlord's reason when declining.
    landlord_note       VARCHAR(500) DEFAULT NULL,
    decided_at          TIMESTAMP NULL DEFAULT NULL,
    created_by          INT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by          INT NULL,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- A room's requests by status, and a boarder's requests, newest first.
    KEY idx_res_room_status (room_id, status),
    KEY idx_res_boarder_recent (boarder_id, created_at),
    CONSTRAINT fk_res_room FOREIGN KEY (room_id)
        REFERENCES rooms(room_id) ON DELETE CASCADE,
    CONSTRAINT fk_res_boarder FOREIGN KEY (boarder_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_res_created_by FOREIGN KEY (created_by)
        REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_res_updated_by FOREIGN KEY (updated_by)
        REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- SIGN-IN AND SECURITY
-- =========================================================

-- ---------------------------------------------------------
-- 12. password_resets
-- One row per reset request. Only hashes of the code and token are stored.
-- The code dies after 5 wrong tries; each row is single use and expires.
-- ---------------------------------------------------------
CREATE TABLE password_resets (
    reset_id    INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    -- A random placeholder until the code is entered correctly.
    token_hash  CHAR(64) NOT NULL,
    code_hash   VARCHAR(255) DEFAULT NULL,
    attempts    TINYINT UNSIGNED NOT NULL DEFAULT 0,
    verified_at DATETIME DEFAULT NULL,
    expires_at  DATETIME NOT NULL,
    used_at     DATETIME DEFAULT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_reset_token (token_hash),
    KEY idx_reset_user (user_id),
    CONSTRAINT fk_reset_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 13. remember_tokens
-- "Remember me" devices. Only a hash of the cookie's validator is stored.
-- Each token is used once, then replaced.
-- ---------------------------------------------------------
CREATE TABLE remember_tokens (
    token_id        INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    selector        CHAR(24) NOT NULL,
    validator_hash  CHAR(64) NOT NULL,
    expires_at      DATETIME NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_remember_selector (selector),
    KEY idx_remember_user (user_id),
    KEY idx_remember_expires (expires_at),
    CONSTRAINT fk_remember_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 14. login_attempts
-- Failed logins and reset requests, counted per account and per IP
-- to limit guessing.
-- ---------------------------------------------------------
CREATE TABLE login_attempts (
    attempt_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    -- 'login', 'reset' or 'contact'.
    kind         VARCHAR(20) NOT NULL,
    -- The email (or username) typed, lowercased.
    identifier   VARCHAR(190) NOT NULL,
    -- Its account, or NULL if none.
    user_id      INT NULL,
    -- 45 characters fits IPv6.
    ip_address   VARCHAR(45) NOT NULL,
    attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_kind_identifier_time (kind, identifier, attempted_at),
    KEY idx_kind_ip_time (kind, ip_address, attempted_at),
    KEY idx_attempted_at (attempted_at),
    CONSTRAINT fk_attempts_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- ADMINISTRATION
-- =========================================================

-- ---------------------------------------------------------
-- 15. site_settings
-- Settings an admin changes, e.g. the sign-in background. Key/value, so a
-- new setting needs no new column.
-- ---------------------------------------------------------
CREATE TABLE site_settings (
    setting_key     VARCHAR(64) NOT NULL PRIMARY KEY,
    setting_value   TEXT DEFAULT NULL,
    -- Who created / last changed it.
    created_by      INT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by      INT NULL,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_settings_created_by FOREIGN KEY (created_by)
        REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_settings_updated_by FOREIGN KEY (updated_by)
        REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 16. audit_logs
-- Who did what, and when (admin/activity.php). target_label keeps the name
-- as it was, so entries still make sense after a rename. IP and browser are
-- kept for sign-ins only, and deleted after 90 days.
-- ---------------------------------------------------------
CREATE TABLE audit_logs (
    log_id        INT AUTO_INCREMENT PRIMARY KEY,
    actor_id      INT NULL,
    actor_role    VARCHAR(20) NULL,
    action        VARCHAR(40) NOT NULL,
    target_type   VARCHAR(20) NOT NULL,
    target_id     INT NULL,
    target_label  VARCHAR(200) NOT NULL DEFAULT '',
    detail        VARCHAR(500) DEFAULT NULL,
    ip_address    VARCHAR(45) NULL,
    user_agent    VARCHAR(120) NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_audit_created (created_at),
    KEY idx_audit_target  (target_type, target_id, created_at),
    KEY idx_audit_actor   (actor_id, created_at),
    KEY idx_audit_action  (action, created_at),
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id)
        REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- REVIEWS, MESSAGES AND NOTIFICATIONS (used by the React app)
-- =========================================================

-- ---------------------------------------------------------
-- 17. reviews
-- One review per boarder per listing, only after an accepted stay
-- (checked by the API). reviewer_name keeps the name shown, so a review
-- still reads right if the account is later removed.
-- ---------------------------------------------------------
CREATE TABLE reviews (
    review_id           INT AUTO_INCREMENT PRIMARY KEY,
    boarding_house_id   INT NOT NULL,
    boarder_id          INT NULL,
    reviewer_name       VARCHAR(150) NOT NULL,
    rating              TINYINT UNSIGNED NOT NULL,
    comment             VARCHAR(1000) NOT NULL,
    landlord_reply      VARCHAR(1000) DEFAULT NULL,
    replied_at          TIMESTAMP NULL DEFAULT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_review_boarder (boarding_house_id, boarder_id),
    KEY idx_reviews_bh_recent (boarding_house_id, created_at),
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT fk_reviews_bh FOREIGN KEY (boarding_house_id)
        REFERENCES boarding_houses(boarding_house_id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_boarder FOREIGN KEY (boarder_id)
        REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 18. conversations
-- One chat per boarder per listing, between the boarder and its landlord.
-- ---------------------------------------------------------
CREATE TABLE conversations (
    conversation_id     INT AUTO_INCREMENT PRIMARY KEY,
    boarding_house_id   INT NOT NULL,
    boarder_id          INT NOT NULL,
    landlord_id         INT NOT NULL,
    -- Read markers per side, for the unread badges.
    boarder_last_read   TIMESTAMP NULL DEFAULT NULL,
    landlord_last_read  TIMESTAMP NULL DEFAULT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_conversation (boarding_house_id, boarder_id),
    KEY idx_conv_boarder (boarder_id, updated_at),
    KEY idx_conv_landlord (landlord_id, updated_at),
    CONSTRAINT fk_conv_bh FOREIGN KEY (boarding_house_id)
        REFERENCES boarding_houses(boarding_house_id) ON DELETE CASCADE,
    CONSTRAINT fk_conv_boarder FOREIGN KEY (boarder_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_conv_landlord FOREIGN KEY (landlord_id)
        REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 19. messages
-- ---------------------------------------------------------
CREATE TABLE messages (
    message_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id     INT NOT NULL,
    sender_id           INT NULL,
    body                VARCHAR(2000) NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_messages_conv (conversation_id, created_at),
    CONSTRAINT fk_messages_conv FOREIGN KEY (conversation_id)
        REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id)
        REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 20. notifications
-- For one user (user_id), or for every account with a role (for_role,
-- e.g. 'admin' = every administrator and super admin).
-- ---------------------------------------------------------
CREATE TABLE notifications (
    notification_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT NULL,
    for_role            VARCHAR(20) NULL,
    title               VARCHAR(150) NOT NULL,
    body                VARCHAR(500) NOT NULL,
    -- Path inside the app the notification opens, e.g. /landlord/listings/5.
    link                VARCHAR(255) DEFAULT NULL,
    is_read             TINYINT(1) NOT NULL DEFAULT 0,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_notif_user (user_id, is_read, created_at),
    KEY idx_notif_role (for_role, is_read, created_at),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 21. contact_messages
-- Sent from the public Contact Us page; read in the admin panel's inbox.
-- ---------------------------------------------------------
CREATE TABLE contact_messages (
    contact_message_id  INT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    email               VARCHAR(150) NOT NULL,
    topic               VARCHAR(60) NOT NULL,
    message             TEXT NOT NULL,
    is_read             TINYINT(1) NOT NULL DEFAULT 0,
    ip_address          VARCHAR(45) NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_contact_unread (is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- SEED DATA: demo accounts and listings (same as the React demo).
-- Dates are relative to NOW(), so the demo always looks current.
--
-- Demo sign-ins (change or remove these before going live):
--   Super admin  superadmin  (or superadmin@roomease.ph)  Superadmin#2026
--   Admin        admin       (or admin@roomease.ph)       Admin#2026
--   Landlords    juan@ / rosa@ / ramon@roomease.ph         Landlord#2026
--   Boarders     maria@roomease.ph and the others          Boarder#2026
-- Only bcrypt hashes of the passwords are stored.
-- =========================================================

INSERT INTO users
    (user_id, email, username, password_hash, first_name, middle_name, last_name, phone_number, role, is_active, deactivation_reason, created_at)
VALUES
    (1, 'superadmin@roomease.ph', 'superadmin', '$2y$10$zwzE7ELZ2eQL46I1Lu68xu3V1uBGLRNk3Q0VPtL2lFf5JkIlSAoKK', 'System', NULL, 'Administrator', '09000000000', 'super_admin', 1, NULL, NOW() - INTERVAL 7680 HOUR),
    (2, 'maria@roomease.ph', NULL, '$2y$10$dsKoKzhfiy3rd.84LNlSF.faZ6JU.aOfDWKrJMdFTFAYXR2okUSGu', 'Maria', NULL, 'Santos', '09171234567', 'boarder', 1, NULL, NOW() - INTERVAL 3840 HOUR),
    (3, 'juan@roomease.ph', NULL, '$2y$10$OWZNoMIv7Sq/IduY52PeCuAzJi7PXTcNJVTLmC0EvA7jyVAtjKT6e', 'Juan', NULL, 'Dela Cruz', '09187654321', 'landlord', 1, NULL, NOW() - INTERVAL 5760 HOUR),
    (4, 'admin@roomease.ph', 'admin', '$2y$10$JM2RrwK/6hhuazj60PGr5uVXv.ADh07zYIvypHDAWcscbVPPdADHi', 'Grace', NULL, 'Villamor', '09205550101', 'administrator', 1, NULL, NOW() - INTERVAL 7200 HOUR),
    (5, 'rosa@roomease.ph', NULL, '$2y$10$OWZNoMIv7Sq/IduY52PeCuAzJi7PXTcNJVTLmC0EvA7jyVAtjKT6e', 'Rosa', NULL, 'Villanueva', '09192223344', 'landlord', 1, NULL, NOW() - INTERVAL 5040 HOUR),
    (6, 'ramon@roomease.ph', NULL, '$2y$10$OWZNoMIv7Sq/IduY52PeCuAzJi7PXTcNJVTLmC0EvA7jyVAtjKT6e', 'Ramon', NULL, 'Bautista', '09275550182', 'landlord', 1, NULL, NOW() - INTERVAL 1080 HOUR),
    (7, 'john.reyes@example.com', NULL, '$2y$10$dsKoKzhfiy3rd.84LNlSF.faZ6JU.aOfDWKrJMdFTFAYXR2okUSGu', 'John', NULL, 'Reyes', '09153001122', 'boarder', 1, NULL, NOW() - INTERVAL 480 HOUR),
    (8, 'ana.cruz@example.com', NULL, '$2y$10$dsKoKzhfiy3rd.84LNlSF.faZ6JU.aOfDWKrJMdFTFAYXR2okUSGu', 'Ana', NULL, 'Cruz', '09164107788', 'boarder', 1, NULL, NOW() - INTERVAL 840 HOUR),
    (9, 'luis.garcia@example.com', NULL, '$2y$10$dsKoKzhfiy3rd.84LNlSF.faZ6JU.aOfDWKrJMdFTFAYXR2okUSGu', 'Luis', NULL, 'Garcia', NULL, 'boarder', 1, NULL, NOW() - INTERVAL 1680 HOUR),
    (10, 'carla.m@example.com', NULL, '$2y$10$dsKoKzhfiy3rd.84LNlSF.faZ6JU.aOfDWKrJMdFTFAYXR2okUSGu', 'Carla', NULL, 'Mendoza', '09178802211', 'boarder', 0, 'Reported for sharing other boarders’ contact details.', NOW() - INTERVAL 2280 HOUR),
    (11, 'mark.villanueva@example.com', NULL, '$2y$10$dsKoKzhfiy3rd.84LNlSF.faZ6JU.aOfDWKrJMdFTFAYXR2okUSGu', 'Mark', NULL, 'Villanueva', NULL, 'boarder', 1, NULL, NOW() - INTERVAL 866 HOUR),
    (12, 'joy.santiago@example.com', NULL, '$2y$10$dsKoKzhfiy3rd.84LNlSF.faZ6JU.aOfDWKrJMdFTFAYXR2okUSGu', 'Joy', NULL, 'Santiago', NULL, 'boarder', 1, NULL, NOW() - INTERVAL 1082 HOUR),
    (13, 'paolo.ramos@example.com', NULL, '$2y$10$dsKoKzhfiy3rd.84LNlSF.faZ6JU.aOfDWKrJMdFTFAYXR2okUSGu', 'Paolo', NULL, 'Ramos', NULL, 'boarder', 1, NULL, NOW() - INTERVAL 1274 HOUR),
    (14, 'grace.lim@example.com', NULL, '$2y$10$dsKoKzhfiy3rd.84LNlSF.faZ6JU.aOfDWKrJMdFTFAYXR2okUSGu', 'Grace', NULL, 'Lim', NULL, 'boarder', 1, NULL, NOW() - INTERVAL 1538 HOUR),
    (15, 'kevin.tan@example.com', NULL, '$2y$10$dsKoKzhfiy3rd.84LNlSF.faZ6JU.aOfDWKrJMdFTFAYXR2okUSGu', 'Kevin', NULL, 'Tan', NULL, 'boarder', 1, NULL, NOW() - INTERVAL 1802 HOUR),
    (16, 'liza.navarro@example.com', NULL, '$2y$10$dsKoKzhfiy3rd.84LNlSF.faZ6JU.aOfDWKrJMdFTFAYXR2okUSGu', 'Liza', NULL, 'Navarro', NULL, 'boarder', 1, NULL, NOW() - INTERVAL 2090 HOUR),
    (17, 'rico.aquino@example.com', NULL, '$2y$10$dsKoKzhfiy3rd.84LNlSF.faZ6JU.aOfDWKrJMdFTFAYXR2okUSGu', 'Rico', NULL, 'Aquino', NULL, 'boarder', 1, NULL, NOW() - INTERVAL 2402 HOUR),
    (18, 'bea.flores@example.com', NULL, '$2y$10$dsKoKzhfiy3rd.84LNlSF.faZ6JU.aOfDWKrJMdFTFAYXR2okUSGu', 'Bea', NULL, 'Flores', NULL, 'boarder', 1, NULL, NOW() - INTERVAL 2618 HOUR),
    (19, 'jun.castillo@example.com', NULL, '$2y$10$dsKoKzhfiy3rd.84LNlSF.faZ6JU.aOfDWKrJMdFTFAYXR2okUSGu', 'Jun', NULL, 'Castillo', NULL, 'boarder', 1, NULL, NOW() - INTERVAL 2978 HOUR),
    (20, 'ella.ramirez@example.com', NULL, '$2y$10$dsKoKzhfiy3rd.84LNlSF.faZ6JU.aOfDWKrJMdFTFAYXR2okUSGu', 'Ella', NULL, 'Ramirez', NULL, 'boarder', 1, NULL, NOW() - INTERVAL 3362 HOUR),
    (21, 'nina.torres@example.com', NULL, '$2y$10$dsKoKzhfiy3rd.84LNlSF.faZ6JU.aOfDWKrJMdFTFAYXR2okUSGu', 'Nina', NULL, 'Torres', NULL, 'boarder', 1, NULL, NOW() - INTERVAL 3674 HOUR),
    (22, 'arvin.dizon@example.com', NULL, '$2y$10$dsKoKzhfiy3rd.84LNlSF.faZ6JU.aOfDWKrJMdFTFAYXR2okUSGu', 'Arvin', NULL, 'Dizon', NULL, 'boarder', 1, NULL, NOW() - INTERVAL 4010 HOUR),
    (23, 'mica.reyes@example.com', NULL, '$2y$10$dsKoKzhfiy3rd.84LNlSF.faZ6JU.aOfDWKrJMdFTFAYXR2okUSGu', 'Mica', NULL, 'Reyes', NULL, 'boarder', 1, NULL, NOW() - INTERVAL 4322 HOUR);

INSERT INTO room_types
    (room_type_id, room_type_name)
VALUES
    (1, 'Single Room'),
    (2, 'Private Room'),
    (3, 'Double Sharing'),
    (4, 'Bed Spacer'),
    (5, 'Dormitory');

INSERT INTO amenities
    (amenity_id, landlord_id, amenity_name)
VALUES
    (1, NULL, 'Wi-Fi'),
    (2, NULL, 'Aircon'),
    (3, NULL, 'Private CR'),
    (4, NULL, 'Laundry'),
    (5, NULL, 'Study Area'),
    (6, NULL, 'Kitchen'),
    (7, NULL, 'CCTV'),
    (8, NULL, 'Parking');

INSERT INTO utilities
    (utility_id, landlord_id, utility_name)
VALUES
    (1, NULL, 'Water'),
    (2, NULL, 'Electricity'),
    (3, NULL, 'Trash Collection'),
    (4, NULL, 'Internet / Wi-Fi'),
    (5, NULL, 'Cooking Gas');

INSERT INTO boarding_houses
    (boarding_house_id, landlord_id, name, address, area, moderation_status, rejection_reason, submitted_at, moderated_at, moderated_by, description, house_rules, curfew, minimum_stay_months, payment_methods, gender_policy, visitors_allowed, pets_allowed, cooking_allowed, latitude, longitude, views, created_by, created_at)
VALUES
    (1, 3, 'Sunrise Boarding House', '12 Rizal St., Poblacion Zone 3', 'Poblacion', 'approved', NULL, NOW() - INTERVAL 5280 HOUR, NOW() - INTERVAL 5232 HOUR, 4, 'Quiet two-storey house a short walk from the public market and jeepney terminal. Each room has its own study table, cabinet and window. Water and electricity are included up to a monthly limit.', 'Visitors in the lobby only, until 8 PM
Quiet hours from 10 PM to 6 AM
No smoking inside the house
Rent is due every 5th of the month', '10:00 PM', 5, 'Cash,GCash', 'any', 1, 0, 1, 10.6792, 124.8011, 342, 3, NOW() - INTERVAL 5280 HOUR),
    (2, 3, 'Riverside Dormitory', 'Purok 2, San Isidro (beside the river park)', 'San Isidro', 'pending', NULL, NOW() - INTERVAL 96 HOUR, NULL, NULL, 'Dorm-style rooms with bunk beds for 2–4 boarders. Shared kitchen and laundry area on the ground floor. Curfew at 10 PM.', 'Curfew at 10 PM sharp
Clean up the shared kitchen after use
No alcohol inside the dorm', '10:00 PM', 4, 'Cash', 'male', 0, 0, 1, 10.6668, 124.8052, 128, 3, NOW() - INTERVAL 96 HOUR),
    (3, 3, 'City View Boarding House', '45 Magsaysay Ave., Poblacion', 'Poblacion', 'approved', NULL, NOW() - INTERVAL 288 HOUR, NOW() - INTERVAL 216 HOUR, 4, 'Air-conditioned single rooms with private bathrooms on the upper floors, overlooking the town center. Ideal for working professionals and graduating students.', 'No cooking in the rooms; use the common pantry
Guests must sign the logbook
One month advance and one month deposit', NULL, 6, 'Cash,GCash,Bank transfer', 'any', 1, 0, 0, 10.6779, 124.7999, 276, 3, NOW() - INTERVAL 288 HOUR),
    (4, 5, 'Green Haven Residences', 'Brgy. Pangasugan, 5 min walk to VSU main gate', 'Near VSU', 'approved', NULL, NOW() - INTERVAL 4320 HOUR, NOW() - INTERVAL 4272 HOUR, 4, 'Student-friendly single rooms surrounded by trees, a few minutes from the VSU main gate. Common study lounge with fast Wi-Fi.', 'Female boarders only
Male visitors in the receiving area only
Quiet hours from 10 PM', '11:00 PM', 5, 'Cash,GCash', 'female', 1, 0, 1, 10.7425, 124.7969, 301, 5, NOW() - INTERVAL 4320 HOUR),
    (5, 5, 'VSU Gate Bedspace', 'Highway, Brgy. Guadalupe, across VSU', 'Near VSU', 'approved', NULL, NOW() - INTERVAL 3600 HOUR, NOW() - INTERVAL 3552 HOUR, 4, 'Affordable bedspace for students. Four beds per room, shared bathrooms on each floor.', 'Lockers are provided; bring your own padlock
Lights off in the rooms by 11 PM', '10:00 PM', 4, 'Cash', 'male', 0, 0, 0, 10.7462, 124.7958, 219, 5, NOW() - INTERVAL 3600 HOUR),
    (6, 6, 'Baybay Central Lodging', '8 Bonifacio St., City Center', 'Baybay City Center', 'approved', NULL, NOW() - INTERVAL 2880 HOUR, NOW() - INTERVAL 2832 HOUR, 4, 'Fully furnished rooms near banks, malls and the city hall. Includes weekly cleaning of common areas.', 'Small pets allowed with the owner’s approval
Weekly cleaning of common areas is included', NULL, 3, 'Cash,GCash,Maya,Bank transfer', 'any', 1, 1, 1, 10.6838, 124.8004, 187, 6, NOW() - INTERVAL 2880 HOUR),
    (7, 6, 'Seaside Boarding House', 'Coastal Rd., San Isidro', 'San Isidro', 'approved', NULL, NOW() - INTERVAL 4800 HOUR, NOW() - INTERVAL 4752 HOUR, 4, 'Breezy shared rooms a block from the shoreline. Shared kitchen with refrigerator and rice cooker.', 'Two boarders per room
Label your food in the shared refrigerator', '10:30 PM', 4, 'Cash,GCash', 'any', 1, 0, 1, 10.6655, 124.7988, 96, 6, NOW() - INTERVAL 4800 HOUR),
    (8, 6, 'Poblacion Student Inn', '3 Mabini St., Poblacion', 'Poblacion', 'approved', NULL, NOW() - INTERVAL 2160 HOUR, NOW() - INTERVAL 2112 HOUR, 4, 'Two-person rooms with individual study desks. Near schools, eateries and printing shops.', 'Female boarders only
No cooking in the rooms
Study area open until midnight', '10:00 PM', 5, 'Cash,GCash', 'female', 0, 0, 0, 10.6801, 124.8024, 154, 6, NOW() - INTERVAL 2160 HOUR),
    (9, 6, 'Mountain View Bedspace', 'Brgy. Gabas, along the national highway', 'Near VSU', 'pending', NULL, NOW() - INTERVAL 24 HOUR, NULL, NULL, 'New bedspace with a view of the mountains, a short tricycle ride to VSU. Four beds per room with individual lockers.', 'Lockers provided
Quiet hours from 10 PM', '10:00 PM', 4, 'Cash,GCash', 'any', 0, 0, 1, 10.7398, 124.7991, 0, 6, NOW() - INTERVAL 24 HOUR),
    (10, 5, 'Kalinaw Boarding House', 'Poblacion', 'Poblacion', 'rejected', 'Please add the full street address and at least one photo of a room, so boarders know what to expect.', NOW() - INTERVAL 72 HOUR, NOW() - INTERVAL 48 HOUR, 4, 'Quiet rooms near the plaza.', NULL, NULL, NULL, 'Cash', 'any', NULL, NULL, NULL, 10.6808, 124.8017, 0, 5, NOW() - INTERVAL 72 HOUR);

INSERT INTO rooms
    (room_id, boarding_house_id, name, room_type_id, monthly_rent, capacity, slots_taken, is_open, created_by, created_at)
VALUES
    (1, 1, 'Room 1', 1, 3000, 1, 0, 1, 3, NOW() - INTERVAL 5280 HOUR),
    (2, 1, 'Room 2', 1, 3000, 1, 0, 1, 3, NOW() - INTERVAL 5280 HOUR),
    (3, 1, 'Room 3', 1, 3000, 1, 1, 1, 3, NOW() - INTERVAL 5280 HOUR),
    (4, 1, 'Room 4', 1, 3000, 1, 1, 1, 3, NOW() - INTERVAL 5280 HOUR),
    (5, 1, 'Room 5', 1, 3000, 1, 1, 1, 3, NOW() - INTERVAL 5280 HOUR),
    (6, 2, 'Room 1', 5, 2500, 6, 4, 1, 3, NOW() - INTERVAL 96 HOUR),
    (7, 2, 'Room 2', 5, 2500, 6, 5, 1, 3, NOW() - INTERVAL 96 HOUR),
    (8, 2, 'Room 3', 5, 2500, 6, 5, 1, 3, NOW() - INTERVAL 96 HOUR),
    (9, 2, 'Room 4', 5, 2500, 6, 6, 1, 3, NOW() - INTERVAL 96 HOUR),
    (10, 2, 'Room 5', 5, 2500, 6, 6, 1, 3, NOW() - INTERVAL 96 HOUR),
    (11, 2, 'Room 6', 5, 2500, 6, 6, 1, 3, NOW() - INTERVAL 96 HOUR),
    (12, 2, 'Room 7', 5, 2500, 6, 6, 1, 3, NOW() - INTERVAL 96 HOUR),
    (13, 2, 'Room 8', 5, 2500, 6, 6, 1, 3, NOW() - INTERVAL 96 HOUR),
    (14, 3, 'Room 1', 1, 3500, 1, 0, 1, 3, NOW() - INTERVAL 288 HOUR),
    (15, 3, 'Room 2', 1, 3500, 1, 1, 1, 3, NOW() - INTERVAL 288 HOUR),
    (16, 3, 'Room 3', 1, 3500, 1, 1, 1, 3, NOW() - INTERVAL 288 HOUR),
    (17, 3, 'Room 4', 1, 3500, 1, 1, 1, 3, NOW() - INTERVAL 288 HOUR),
    (18, 4, 'Room 1', 1, 2800, 1, 0, 1, 5, NOW() - INTERVAL 4320 HOUR),
    (19, 4, 'Room 2', 1, 2800, 1, 0, 1, 5, NOW() - INTERVAL 4320 HOUR),
    (20, 4, 'Room 3', 1, 2800, 1, 0, 1, 5, NOW() - INTERVAL 4320 HOUR),
    (21, 4, 'Room 4', 1, 2800, 1, 0, 1, 5, NOW() - INTERVAL 4320 HOUR),
    (22, 4, 'Room 5', 1, 2800, 1, 1, 1, 5, NOW() - INTERVAL 4320 HOUR),
    (23, 4, 'Room 6', 1, 2800, 1, 1, 1, 5, NOW() - INTERVAL 4320 HOUR),
    (24, 4, 'Room 7', 1, 2800, 1, 1, 1, 5, NOW() - INTERVAL 4320 HOUR),
    (25, 4, 'Room 8', 1, 2800, 1, 1, 1, 5, NOW() - INTERVAL 4320 HOUR),
    (26, 4, 'Room 9', 1, 2800, 1, 1, 1, 5, NOW() - INTERVAL 4320 HOUR),
    (27, 4, 'Room 10', 1, 2800, 1, 1, 1, 5, NOW() - INTERVAL 4320 HOUR),
    (28, 5, 'Room 1', 4, 1500, 4, 1, 1, 5, NOW() - INTERVAL 3600 HOUR),
    (29, 5, 'Room 2', 4, 1500, 4, 2, 1, 5, NOW() - INTERVAL 3600 HOUR),
    (30, 5, 'Room 3', 4, 1500, 4, 4, 1, 5, NOW() - INTERVAL 3600 HOUR),
    (31, 5, 'Room 4', 4, 1500, 4, 4, 1, 5, NOW() - INTERVAL 3600 HOUR),
    (32, 5, 'Room 5', 4, 1500, 4, 4, 1, 5, NOW() - INTERVAL 3600 HOUR),
    (33, 5, 'Room 6', 4, 1500, 4, 4, 1, 5, NOW() - INTERVAL 3600 HOUR),
    (34, 6, 'Room 1', 2, 4000, 1, 0, 1, 6, NOW() - INTERVAL 2880 HOUR),
    (35, 6, 'Room 2', 2, 4000, 1, 1, 1, 6, NOW() - INTERVAL 2880 HOUR),
    (36, 6, 'Room 3', 2, 4000, 1, 1, 1, 6, NOW() - INTERVAL 2880 HOUR),
    (37, 6, 'Room 4', 2, 4000, 1, 1, 1, 6, NOW() - INTERVAL 2880 HOUR),
    (38, 6, 'Room 5', 2, 4000, 1, 1, 1, 6, NOW() - INTERVAL 2880 HOUR),
    (39, 6, 'Room 6', 2, 4000, 1, 1, 1, 6, NOW() - INTERVAL 2880 HOUR),
    (40, 7, 'Room 1', 3, 2000, 2, 2, 1, 6, NOW() - INTERVAL 4800 HOUR),
    (41, 7, 'Room 2', 3, 2000, 2, 2, 1, 6, NOW() - INTERVAL 4800 HOUR),
    (42, 7, 'Room 3', 3, 2000, 2, 2, 1, 6, NOW() - INTERVAL 4800 HOUR),
    (43, 7, 'Room 4', 3, 2000, 2, 2, 1, 6, NOW() - INTERVAL 4800 HOUR),
    (44, 7, 'Room 5', 3, 2000, 2, 2, 1, 6, NOW() - INTERVAL 4800 HOUR),
    (45, 8, 'Room 1', 3, 2200, 2, 0, 1, 6, NOW() - INTERVAL 2160 HOUR),
    (46, 8, 'Room 2', 3, 2200, 2, 0, 1, 6, NOW() - INTERVAL 2160 HOUR),
    (47, 8, 'Room 3', 3, 2200, 2, 1, 1, 6, NOW() - INTERVAL 2160 HOUR),
    (48, 8, 'Room 4', 3, 2200, 2, 2, 1, 6, NOW() - INTERVAL 2160 HOUR),
    (49, 8, 'Room 5', 3, 2200, 2, 2, 1, 6, NOW() - INTERVAL 2160 HOUR),
    (50, 8, 'Room 6', 3, 2200, 2, 2, 1, 6, NOW() - INTERVAL 2160 HOUR),
    (51, 8, 'Room 7', 3, 2200, 2, 2, 1, 6, NOW() - INTERVAL 2160 HOUR),
    (52, 9, 'Room 1', 4, 1800, 4, 0, 1, 6, NOW() - INTERVAL 24 HOUR),
    (53, 9, 'Room 2', 4, 1800, 4, 0, 1, 6, NOW() - INTERVAL 24 HOUR),
    (54, 9, 'Room 3', 4, 1800, 4, 1, 1, 6, NOW() - INTERVAL 24 HOUR),
    (55, 9, 'Room 4', 4, 1800, 4, 1, 1, 6, NOW() - INTERVAL 24 HOUR),
    (56, 9, 'Room 5', 4, 1800, 4, 1, 1, 6, NOW() - INTERVAL 24 HOUR),
    (57, 9, 'Room 6', 4, 1800, 4, 1, 1, 6, NOW() - INTERVAL 24 HOUR),
    (58, 10, 'Room 1', 1, 2400, 1, 0, 1, 5, NOW() - INTERVAL 72 HOUR),
    (59, 10, 'Room 2', 1, 2400, 1, 0, 1, 5, NOW() - INTERVAL 72 HOUR),
    (60, 10, 'Room 3', 1, 2400, 1, 0, 1, 5, NOW() - INTERVAL 72 HOUR);

INSERT INTO boarding_house_amenities
    (boarding_house_id, amenity_id)
VALUES
    (1, 1),
    (1, 2),
    (1, 7),
    (2, 1),
    (2, 4),
    (2, 6),
    (3, 2),
    (3, 3),
    (3, 5),
    (4, 1),
    (4, 2),
    (4, 5),
    (4, 7),
    (5, 1),
    (5, 4),
    (6, 1),
    (6, 2),
    (6, 3),
    (6, 8),
    (7, 1),
    (7, 6),
    (7, 4),
    (8, 1),
    (8, 5),
    (8, 7),
    (9, 1),
    (9, 4),
    (9, 5),
    (10, 1);

INSERT INTO boarding_house_utilities
    (boarding_house_id, utility_id, billing_policy)
VALUES
    (1, 1, 'Included in rent'),
    (1, 2, 'Included up to ₱300 a month'),
    (1, 4, 'Included'),
    (2, 1, 'Included in rent'),
    (2, 2, 'Split equally among roommates'),
    (2, 5, 'Bring your own tank'),
    (3, 1, 'Included in rent'),
    (3, 2, 'Sub-metered, about ₱12 per kWh'),
    (3, 4, 'Included'),
    (3, 3, 'Included'),
    (4, 1, 'Included in rent'),
    (4, 2, 'Sub-metered'),
    (4, 4, 'Included'),
    (5, 1, 'Included in rent'),
    (5, 2, 'Included in rent'),
    (6, 1, 'Included in rent'),
    (6, 2, 'Own meter, paid to the electric cooperative'),
    (6, 4, 'Included'),
    (6, 3, 'Included'),
    (7, 1, 'Included in rent'),
    (7, 2, 'Split between roommates'),
    (8, 1, 'Included in rent'),
    (8, 2, 'Included up to ₱250 a month'),
    (8, 4, 'Included'),
    (9, 1, 'Included in rent'),
    (9, 2, 'Included up to ₱200 a month');

INSERT INTO favorites
    (user_id, boarding_house_id)
VALUES
    (2, 1),
    (2, 3);

INSERT INTO reservations
    (reservation_id, room_id, boarder_id, move_in_date, message, status, landlord_note, decided_at, created_by, created_at)
VALUES
    (1, 1, 2, CURDATE() + INTERVAL 30 DAY, 'Hi! I’m an incoming 2nd year student at VSU. Is the room available next month?', 'pending', NULL, NULL, 2, NOW() - INTERVAL 49 HOUR),
    (2, 40, 2, CURDATE() + INTERVAL 10 DAY, NULL, 'declined', 'Sorry, the last slot was taken the day before your request.', NOW() - INTERVAL 120 HOUR, 2, NOW() - INTERVAL 145 HOUR),
    (3, 6, 7, CURDATE() + INTERVAL 14 DAY, NULL, 'pending', NULL, NULL, 7, NOW() - INTERVAL 73 HOUR),
    (4, 14, 8, CURDATE() - INTERVAL 1 DAY, NULL, 'accepted', NULL, NOW() - INTERVAL 121 HOUR, 8, NOW() - INTERVAL 121 HOUR),
    (5, 1, 9, CURDATE() - INTERVAL 2 DAY, NULL, 'accepted', NULL, NOW() - INTERVAL 193 HOUR, 9, NOW() - INTERVAL 193 HOUR),
    (6, 6, 10, CURDATE() - INTERVAL 5 DAY, NULL, 'accepted', NULL, NOW() - INTERVAL 289 HOUR, 10, NOW() - INTERVAL 289 HOUR),
    (7, 14, 11, CURDATE() - INTERVAL 14 DAY, NULL, 'accepted', NULL, NOW() - INTERVAL 577 HOUR, 11, NOW() - INTERVAL 577 HOUR),
    (8, 1, 12, CURDATE() - INTERVAL 23 DAY, NULL, 'declined', NULL, NOW() - INTERVAL 793 HOUR, 12, NOW() - INTERVAL 793 HOUR),
    (9, 6, 13, CURDATE() - INTERVAL 31 DAY, NULL, 'accepted', NULL, NOW() - INTERVAL 985 HOUR, 13, NOW() - INTERVAL 985 HOUR),
    (10, 14, 14, CURDATE() - INTERVAL 42 DAY, NULL, 'cancelled', NULL, NOW() - INTERVAL 1249 HOUR, 14, NOW() - INTERVAL 1249 HOUR),
    (11, 1, 15, CURDATE() - INTERVAL 53 DAY, NULL, 'accepted', NULL, NOW() - INTERVAL 1513 HOUR, 15, NOW() - INTERVAL 1513 HOUR),
    (12, 6, 16, CURDATE() - INTERVAL 65 DAY, NULL, 'declined', NULL, NOW() - INTERVAL 1801 HOUR, 16, NOW() - INTERVAL 1801 HOUR),
    (13, 1, 17, CURDATE() - INTERVAL 78 DAY, NULL, 'accepted', NULL, NOW() - INTERVAL 2113 HOUR, 17, NOW() - INTERVAL 2113 HOUR),
    (14, 14, 18, CURDATE() - INTERVAL 87 DAY, NULL, 'accepted', NULL, NOW() - INTERVAL 2329 HOUR, 18, NOW() - INTERVAL 2329 HOUR),
    (15, 6, 19, CURDATE() - INTERVAL 102 DAY, NULL, 'accepted', NULL, NOW() - INTERVAL 2689 HOUR, 19, NOW() - INTERVAL 2689 HOUR),
    (16, 1, 20, CURDATE() - INTERVAL 118 DAY, NULL, 'cancelled', NULL, NOW() - INTERVAL 3073 HOUR, 20, NOW() - INTERVAL 3073 HOUR),
    (17, 14, 21, CURDATE() - INTERVAL 131 DAY, NULL, 'accepted', NULL, NOW() - INTERVAL 3385 HOUR, 21, NOW() - INTERVAL 3385 HOUR),
    (18, 6, 22, CURDATE() - INTERVAL 145 DAY, NULL, 'declined', NULL, NOW() - INTERVAL 3721 HOUR, 22, NOW() - INTERVAL 3721 HOUR),
    (19, 1, 23, CURDATE() - INTERVAL 158 DAY, NULL, 'accepted', NULL, NOW() - INTERVAL 4033 HOUR, 23, NOW() - INTERVAL 4033 HOUR),
    (20, 18, 2, CURDATE() - INTERVAL 140 DAY, NULL, 'accepted', NULL, NOW() - INTERVAL 3601 HOUR, 2, NOW() - INTERVAL 3601 HOUR);

INSERT INTO reviews
    (boarding_house_id, boarder_id, reviewer_name, rating, comment, landlord_reply, replied_at, created_at)
VALUES
    (1, 9, 'Luis Garcia', 5, 'Clean rooms and the owner responds quickly. Walking distance to the market and the jeepney terminal.', 'Thank you, Luis! Glad you’re settling in well.', NOW() - INTERVAL 0 HOUR, NOW() - INTERVAL 24 HOUR),
    (1, 15, 'Kevin Tan', 4, 'Quiet place to study. Water pressure is a bit weak in the early morning though.', NULL, NULL, NOW() - INTERVAL 960 HOUR),
    (1, 17, 'Rico Aquino', 5, 'Felt safe here: CCTV in the hallway and the gate is locked at night.', NULL, NULL, NOW() - INTERVAL 1680 HOUR),
    (2, 13, 'Paolo Ramos', 4, 'Affordable, and the shared kitchen is a big plus for students on a budget.', NULL, NULL, NOW() - INTERVAL 720 HOUR),
    (2, 19, 'Jun Castillo', 3, 'Okay for the price, but the 10 PM curfew is strict.', NULL, NULL, NOW() - INTERVAL 2160 HOUR),
    (3, 8, 'Ana Cruz', 5, 'The aircon and private CR are worth it. Great view of the town at night.', NULL, NULL, NOW() - INTERVAL 12 HOUR),
    (3, 11, 'Mark Villanueva', 5, 'The landlord is kind and fixes things fast.', NULL, NULL, NOW() - INTERVAL 480 HOUR),
    (3, 18, 'Bea Flores', 4, 'Very comfortable. A bit noisy on weekends because of the street below.', NULL, NULL, NOW() - INTERVAL 1920 HOUR),
    (4, NULL, 'Kim Alvarez', 5, 'Five minutes to VSU and the Wi-Fi in the study lounge is fast.', NULL, NULL, NOW() - INTERVAL 360 HOUR),
    (4, NULL, 'Rhea Bautista', 4, 'Lots of trees around, very relaxing after classes.', NULL, NULL, NOW() - INTERVAL 1080 HOUR),
    (4, NULL, 'Jomar Lee', 4, 'Rooms are on the small side but always clean.', NULL, NULL, NOW() - INTERVAL 2280 HOUR),
    (5, NULL, 'Carlo Mendoza', 4, 'Cheapest option near the gate. Good for freshmen.', NULL, NULL, NOW() - INTERVAL 600 HOUR),
    (5, NULL, 'Andrea Uy', 3, 'Gets crowded during exams, so bring earplugs.', NULL, NULL, NOW() - INTERVAL 1440 HOUR),
    (6, NULL, 'Patrick Go', 5, 'Near the banks and malls, very convenient if you work in the city.', NULL, NULL, NOW() - INTERVAL 432 HOUR),
    (6, NULL, 'Shiela Ramos', 4, 'A bit pricey but fully furnished and well maintained.', NULL, NULL, NOW() - INTERVAL 1200 HOUR),
    (7, NULL, 'Leo Bautista', 4, 'The sea breeze at night means you barely need a fan.', NULL, NULL, NOW() - INTERVAL 840 HOUR),
    (7, NULL, 'Camille Tan', 4, 'Shared kitchen is clean and well kept.', NULL, NULL, NOW() - INTERVAL 1584 HOUR),
    (8, NULL, 'Ivy Morales', 5, 'My roommate and I each have our own desk. Perfect for students.', NULL, NULL, NOW() - INTERVAL 288 HOUR),
    (8, NULL, 'Dan Ocampo', 4, 'Close to printing shops and eateries.', NULL, NULL, NOW() - INTERVAL 1392 HOUR);

INSERT INTO conversations
    (conversation_id, boarding_house_id, boarder_id, landlord_id, boarder_last_read, landlord_last_read, created_at)
VALUES
    (1, 1, 2, 3, NOW() - INTERVAL 49 HOUR, NOW() - INTERVAL 1 HOUR, NOW() - INTERVAL 51 HOUR),
    (2, 2, 7, 3, NOW() - INTERVAL 3 HOUR, NOW() - INTERVAL 24 HOUR, NOW() - INTERVAL 3 HOUR);

INSERT INTO messages
    (conversation_id, sender_id, body, created_at)
VALUES
    (1, 2, 'Hi po! Is the single room still available for next month?', NOW() - INTERVAL 51 HOUR),
    (1, 3, 'Hello Maria! Yes, we still have 2 rooms open. You’re welcome to visit this weekend.', NOW() - INTERVAL 44 HOUR),
    (1, 3, 'Water and electricity are included up to ₱300 a month, by the way.', NOW() - INTERVAL 43 HOUR),
    (2, 7, 'Good evening sir, is there a curfew in the dorm?', NOW() - INTERVAL 3 HOUR);

INSERT INTO contact_messages
    (name, email, topic, message, is_read, created_at)
VALUES
    ('Paolo Ramos', 'paolo.ramos@example.com', 'A listing is wrong', 'The rent shown for Seaside Boarding House seems outdated. The landlord told me it is now ₱2,300.', 0, NOW() - INTERVAL 5 HOUR),
    ('Liza Navarro', 'liza.n@example.com', 'My account', 'How do I change the email address on my account?', 1, NOW() - INTERVAL 72 HOUR);

INSERT INTO audit_logs
    (actor_id, actor_role, action, target_type, target_id, target_label, detail, created_at)
VALUES
    (4, 'administrator', 'user.created', 'user', 6, 'Ramon Bautista', NULL, NOW() - INTERVAL 1080 HOUR),
    (4, 'administrator', 'user.deactivated', 'user', 10, 'Carla Mendoza', 'Reported for sharing other boarders’ contact details.', NOW() - INTERVAL 720 HOUR),
    (4, 'administrator', 'listing.approved', 'listing', 3, 'City View Boarding House', NULL, NOW() - INTERVAL 216 HOUR),
    (3, 'landlord', 'reservation.approved', 'reservation', NULL, 'Ana Cruz · City View Boarding House', NULL, NOW() - INTERVAL 120 HOUR),
    (3, 'landlord', 'listing.submitted', 'listing', 2, 'Riverside Dormitory', NULL, NOW() - INTERVAL 96 HOUR),
    (5, 'landlord', 'listing.submitted', 'listing', 10, 'Kalinaw Boarding House', NULL, NOW() - INTERVAL 72 HOUR),
    (4, 'administrator', 'listing.rejected', 'listing', 10, 'Kalinaw Boarding House', 'Please add the full street address and at least one photo of a room.', NOW() - INTERVAL 48 HOUR),
    (6, 'landlord', 'listing.submitted', 'listing', 9, 'Mountain View Bedspace', NULL, NOW() - INTERVAL 24 HOUR);

INSERT INTO site_settings (setting_key, setting_value) VALUES
    ('site_name', 'RoomEase'),
    ('contact_email', 'hello@roomease.ph');
