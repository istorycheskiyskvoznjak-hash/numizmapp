import React from 'react';
import { Profile as ProfileData, Collectible } from '../types';
import { Session } from '@supabase/supabase-js';
import Profile from './pages/Profile'; // Import the refactored, reusable Profile component


interface PublicProfileModalProps {
  profile: ProfileData;
  session: Session;
  onClose: () => void;
  onItemClick: (item: Collectible) => void;
  onStartConversation: (userId: string) => void;
  onViewAlbum: (albumId: string) => void;
  onViewCollection: () => void;
  onViewWantlist: () => void;
  // FIX: Added missing 'onParameterSearch' property to match the 'ProfileProps' type.
  onParameterSearch: (field: string, value: any, displayValue?: string) => void;
}


const PublicProfileModal: React.FC<PublicProfileModalProps> = ({ 
    profile, 
    session, 
    onClose, 
    onItemClick, 
    onStartConversation,
    onViewAlbum,
    onViewCollection,
    onViewWantlist,
    onParameterSearch
}) => {
    
    // These handlers will first close the modal, then navigate in the main app view.
    const handleStartChat = (userId: string) => {
        onStartConversation(userId);
        onClose();
    };

    const handleViewAlbum = (albumId: string) => {
        onClose();
        onViewAlbum(albumId);
    };

    const handleViewCollection = () => {
        onClose();
        onViewCollection();
    };
    
    const handleViewWantlist = () => {
        onClose();
        onViewWantlist();
    };

    // FIX: Added a handler for parameter search to close the modal before triggering the search.
    const handleParameterSearch = (field: string, value: any, displayValue?: string) => {
        onClose();
        onParameterSearch(field, value, displayValue);
    };


    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-base-100 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-8 overflow-y-auto">
                   <Profile
                        session={session}
                        profileId={profile.id}
                        onItemClick={onItemClick}
                        onStartConversation={handleStartChat}
                        onViewAlbum={handleViewAlbum}
                        onViewCollection={handleViewCollection}
                        onViewWantlist={handleViewWantlist}
                        // FIX: Passed the 'onParameterSearch' prop to the Profile component.
                        onParameterSearch={handleParameterSearch}
                   />
                </div>
            </div>
        </div>
    );
};

export default PublicProfileModal;