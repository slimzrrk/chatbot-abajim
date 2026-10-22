"""
Configuration settings for the recommendation system.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_DATABASE', 'abajimdb'),
    'port': int(os.getenv('DB_PORT', 3306)),
}

# Role IDs
TEACHER_ROLE_ID = 4
STUDENT_ROLE_ID = 8

# User status
ACTIVE_STATUS = 'active'

# Video status
APPROVED_STATUS = 'APPROVED'

# Recommendation settings
DEFAULT_TOP_N = 5
MIN_SIMILARITY_SCORE = 0.1

# Scoring weights
WEIGHTS = {
    'content': 0.3,      # Weight for content score (videos, webinars)
    'popularity': 0.2,   # Weight for popularity score (followers)
    'interaction': 0.3,  # Weight for interaction score (likes, views)
    'similarity': 0.2,   # Weight for similarity score (collaborative filtering)
}

# Interaction scores
INTERACTION_SCORES = {
    'follow': 5,         # Score for following a teacher
    'like': 3,           # Score for liking a video
    'view': 1,           # Score for viewing a video
}

# Mapping between level_id and material_ids
# This mapping is used to find the correct material_id for a given level_id and subject name
MANUAL_LEVEL_MAPPING = {
    6: [1, 1, 2],
    7: [3, 4, 4],
    8: [5, 5, 6, 7, 7, 8],
    9: [9, 9, 10, 11, 11, 12, 12],
    10: [13, 14, 14, 15, 16, 16, 17, 17],
    11: [18, 18, 19, 20, 21, 21, 22, 22, 23]
}

# Mapping of matiere_id to matiere name
MATIERE_ID_TO_NAME = {
    1: "العربية",           # Arabe (niveau 1)
    2: "رياضيات",           # Mathématiques (niveau 1)
    3: "رياضيات",           # Mathématiques (niveau 2)
    4: "العربية",           # Arabe (niveau 2)
    5: "العربية",           # Arabe (niveau 3)
    6: "الإيقاظ العلمي",     # Sciences (niveau 3)
    7: "الفرنسية",          # Français (niveau 3)
    8: "رياضيات",           # Mathématiques (niveau 3)
    9: "رياضيات",           # Mathématiques (niveau 4)
    10: "الإيقاظ العلمي",    # Sciences (niveau 4)
    11: "الفرنسية",         # Français (niveau 4)
    12: "العربية",          # Arabe (niveau 4)
    13: "الإيقاظ العلمي",    # Sciences (niveau 5)
    14: "الفرنسية",         # Français (niveau 5)
    15: "المواد الاجتماعية", # Sciences sociales (niveau 5)
    16: "رياضيات",          # Mathématiques (niveau 5)
    17: "العربية",          # Arabe (niveau 5)
    18: "رياضيات",          # Mathématiques (niveau 6)
    19: "المواد الاجتماعية", # Sciences sociales (niveau 6)
    20: "الإنجليزية",       # Anglais (niveau 6)
    21: "الفرنسية",         # Français (niveau 6)
    22: "العربية",          # Arabe (niveau 6)
    23: "الإيقاظ العلمي"     # Sciences (niveau 6)
}

# Mapping of level_id to actual school level
LEVEL_ID_TO_SCHOOL_LEVEL = {
    1: 6,  # 1ère année = niveau 6
    2: 7,  # 2ème année = niveau 7
    3: 8,  # 3ème année = niveau 8
    4: 9,  # 4ème année = niveau 9
    5: 10, # 5ème année = niveau 10
    6: 11  # 6ème année = niveau 11
}

# Mapping of school level and subject to manuel_ids
# This mapping is used to find the correct manuel_ids for a given school level and subject
LEVEL_SUBJECT_TO_MANUEL_MAPPING = {
    # Niveau 6 (1ère année)
    6: {
        "رياضيات": [3],           # Mathématiques -> manuel_id 3
        "الإيقاظ العلمي": [],     # Sciences -> pas de manuel
        "الفرنسية": [],          # Français -> pas de manuel
        "العربية": [1, 2]         # Arabe -> manuel_ids 1, 2
    },
    # Niveau 7 (2ème année)
    7: {
        "رياضيات": [4],           # Mathématiques -> manuel_id 4
        "الإيقاظ العلمي": [],     # Sciences -> pas de manuel
        "الفرنسية": [],          # Français -> pas de manuel
        "العربية": [5, 6]         # Arabe -> manuel_ids 5, 6
    },
    # Niveau 8 (3ème année)
    8: {
        "رياضيات": [12],          # Mathématiques -> manuel_id 12
        "الإيقاظ العلمي": [9],    # Sciences -> manuel_id 9
        "الفرنسية": [10, 11],     # Français -> manuel_ids 10, 11
        "العربية": [7, 8]         # Arabe -> manuel_ids 7, 8
    },
    # Niveau 9 (4ème année)
    9: {
        "رياضيات": [13, 14],      # Mathématiques -> manuel_ids 13, 14
        "الإيقاظ العلمي": [15],   # Sciences -> manuel_id 15
        "الفرنسية": [16, 17],     # Français -> manuel_ids 16, 17
        "العربية": [18, 19]       # Arabe -> manuel_ids 18, 19
    },
    # Niveau 10 (5ème année)
    10: {
        "رياضيات": [24, 25],      # Mathématiques -> manuel_ids 24, 25
        "الإيقاظ العلمي": [20],   # Sciences -> manuel_id 20
        "الفرنسية": [21, 22],     # Français -> manuel_ids 21, 22
        "العربية": [26, 27],      # Arabe -> manuel_ids 26, 27
        "المواد الاجتماعية": [23] # Sciences sociales -> manuel_id 23
    },
    # Niveau 11 (6ème année)
    11: {
        "رياضيات": [28, 29],      # Mathématiques -> manuel_ids 28, 29
        "الإيقاظ العلمي": [36],   # Sciences -> manuel_id 36
        "الفرنسية": [32, 33],     # Français -> manuel_ids 32, 33
        "العربية": [34, 35],      # Arabe -> manuel_ids 34, 35
        "المواد الاجتماعية": [30], # Sciences sociales -> manuel_id 30
        "الإنجليزية": [31]        # Anglais -> manuel_id 31
    }
}

# Mapping of matiere_id to subject name
MATIERE_ID_TO_SUBJECT = {
    1: "العربية",           # Arabe
    2: "رياضيات",           # Mathématiques
    3: "رياضيات",           # Mathématiques
    4: "العربية",           # Arabe
    5: "العربية",           # Arabe
    6: "الإيقاظ العلمي",     # Sciences
    7: "الفرنسية",          # Français
    8: "رياضيات",           # Mathématiques
    9: "رياضيات",           # Mathématiques
    10: "الإيقاظ العلمي",    # Sciences
    11: "الفرنسية",         # Français
    12: "العربية",          # Arabe
    13: "الإيقاظ العلمي",    # Sciences
    14: "الفرنسية",         # Français
    15: "المواد الاجتماعية", # Sciences sociales
    16: "رياضيات",          # Mathématiques
    17: "العربية",          # Arabe
    18: "رياضيات",          # Mathématiques
    19: "المواد الاجتماعية", # Sciences sociales
    20: "الإنجليزية",       # Anglais
    21: "الفرنسية",         # Français
    22: "العربية",          # Arabe
    23: "الإيقاظ العلمي"     # Sciences
}

# Mapping of manuel_id to matiere_id
MANUEL_TO_MATIERE_MAPPING = {
    1: 1,   # أنيسي قراءة -> العربية
    2: 1,   # أنيسي تمارين -> العربية
    3: 2,   # رياضيات -> رياضيات
    4: 3,   # رياضيات -> رياضيات
    5: 4,   # مساراتي - كتاب القراءة -> العربية
    6: 4,   # مساراتي التمارين -> العربية
    7: 5,   # ينابيع القراءة -> العربية
    8: 5,   # ينابيع الكتابة - تمارين -> العربية
    9: 6,   # الإيقاظ العلمي -> الإيقاظ العلمي
    10: 7,  # Manuel de lecture -> الفرنسية
    11: 7,  # Cahier dactivités -> الفرنسية
    12: 8,  # رياضيات -> رياضيات
    13: 9,  # رياضيات -> رياضيات
    14: 9,  # رياضيات كراس التمارين -> رياضيات
    15: 10, # الإيقاظ العلمي -> الإيقاظ العلمي
    16: 11, # Manuel de lecture -> الفرنسية
    17: 11, # Cahier dactivités -> الفرنسية
    18: 12, # دروب الحوار -> العربية
    19: 12, # التواصل كتاب التمارين -> العربية
    20: 13, # الإيقاظ العلمي -> الإيقاظ العلمي
    21: 14, # Manuel de lecture -> الفرنسية
    22: 14, # Cahier dactivités -> الفرنسية
    23: 15, # المواد الاجتماعية -> المواد الاجتماعية
    24: 16, # كراس الرياضيات -> رياضيات
    25: 16, # كتاب الرياضيات -> رياضيات
    26: 17, # مسالك الكتابة - كتاب التمارين -> العربية
    27: 17, # مسالك القراءة - كتاب النصوص -> العربية
    28: 18, # كراس الرياضيات -> رياضيات
    29: 18, # كتاب الرياضيات -> رياضيات
    30: 19, # كتاب التاريخ و الجغرافيا -> المواد الاجتماعية
    31: 20, # Prime English -> الإنجليزية
    32: 21, # Cahier dactivités -> الفرنسية
    33: 21, # Manuel de lecture -> الفرنسية
    34: 22, # عالم القراءة - كتاب النصوص -> العربية
    35: 22, # عالم الكتابة - كتاب التمارين -> العربية
    36: 23  # الإيقاظ العلمي -> الإيقاظ العلمي
}
