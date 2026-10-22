"""
Similarity calculation utilities for the recommendation system.
"""

import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse import csr_matrix

def create_interaction_matrix(interactions_df, user_col, item_col, rating_col, normalize=False):
    """
    Create an interaction matrix of users and items.
    
    Args:
        interactions_df (pd.DataFrame): DataFrame containing user-item interactions
        user_col (str): Name of the user column
        item_col (str): Name of the item column
        rating_col (str): Name of the rating column
        normalize (bool): Whether to normalize the matrix
        
    Returns:
        tuple: (interaction_matrix, user_index, item_index)
    """
    # Get unique users and items
    users = interactions_df[user_col].unique()
    items = interactions_df[item_col].unique()
    
    # Create mappings
    user_index = {user: i for i, user in enumerate(users)}
    item_index = {item: i for i, item in enumerate(items)}
    
    # Create interaction matrix
    rows = interactions_df[user_col].map(user_index)
    cols = interactions_df[item_col].map(item_index)
    data = interactions_df[rating_col]
    
    # Create sparse matrix
    interaction_matrix = csr_matrix((data, (rows, cols)), shape=(len(users), len(items)))
    
    # Normalize if requested
    if normalize:
        interaction_matrix = normalize_matrix(interaction_matrix)
    
    return interaction_matrix, user_index, item_index

def normalize_matrix(matrix):
    """
    Normalize a matrix by dividing each row by its norm.
    
    Args:
        matrix (scipy.sparse.csr_matrix): Matrix to normalize
        
    Returns:
        scipy.sparse.csr_matrix: Normalized matrix
    """
    # Calculate row sums
    row_sums = matrix.sum(axis=1).A1
    
    # Replace zeros with ones to avoid division by zero
    row_sums[row_sums == 0] = 1
    
    # Normalize
    normalized_matrix = matrix.copy()
    for i in range(matrix.shape[0]):
        normalized_matrix[i] = matrix[i] / row_sums[i]
    
    return normalized_matrix

def calculate_similarity(matrix, method='cosine'):
    """
    Calculate similarity between users or items.
    
    Args:
        matrix (scipy.sparse.csr_matrix): Interaction matrix
        method (str): Similarity method ('cosine' or 'pearson')
        
    Returns:
        numpy.ndarray: Similarity matrix
    """
    if method == 'cosine':
        return cosine_similarity(matrix)
    else:
        raise ValueError(f"Similarity method '{method}' not supported")

def get_similar_users(user_id, user_similarity, user_index, n=10):
    """
    Get similar users for a given user.
    
    Args:
        user_id (int): User ID
        user_similarity (numpy.ndarray): User similarity matrix
        user_index (dict): Mapping from user IDs to matrix indices
        n (int): Number of similar users to return
        
    Returns:
        list: List of (user_id, similarity_score) tuples
    """
    # Get user index
    if user_id not in user_index:
        return []
    
    user_idx = user_index[user_id]
    
    # Get similarity scores
    similarity_scores = user_similarity[user_idx]
    
    # Create list of (user_id, similarity_score) tuples
    user_scores = [(user, similarity_scores[idx]) for user, idx in user_index.items() if user != user_id]
    
    # Sort by similarity score (descending)
    user_scores.sort(key=lambda x: x[1], reverse=True)
    
    # Return top n
    return user_scores[:n]

def get_recommendations(user_id, interaction_matrix, user_index, item_index, user_similarity, n=10):
    """
    Get item recommendations for a user based on similar users.
    
    Args:
        user_id (int): User ID
        interaction_matrix (scipy.sparse.csr_matrix): Interaction matrix
        user_index (dict): Mapping from user IDs to matrix indices
        item_index (dict): Mapping from item IDs to matrix indices
        user_similarity (numpy.ndarray): User similarity matrix
        n (int): Number of recommendations to return
        
    Returns:
        list: List of (item_id, score) tuples
    """
    # Get user index
    if user_id not in user_index:
        return []
    
    user_idx = user_index[user_id]
    
    # Get similar users
    similar_users = get_similar_users(user_id, user_similarity, user_index)
    
    # Get user's interactions
    user_interactions = interaction_matrix[user_idx].toarray().flatten()
    
    # Initialize scores
    scores = np.zeros(interaction_matrix.shape[1])
    
    # Calculate scores
    for similar_user, similarity in similar_users:
        similar_user_idx = user_index[similar_user]
        similar_user_interactions = interaction_matrix[similar_user_idx].toarray().flatten()
        scores += similarity * similar_user_interactions
    
    # Create reverse mapping from index to item ID
    idx_to_item = {idx: item for item, idx in item_index.items()}
    
    # Create list of (item_id, score) tuples
    item_scores = [(idx_to_item[idx], scores[idx]) for idx in range(len(scores)) 
                   if user_interactions[idx] == 0 and scores[idx] > 0]
    
    # Sort by score (descending)
    item_scores.sort(key=lambda x: x[1], reverse=True)
    
    # Return top n
    return item_scores[:n]
