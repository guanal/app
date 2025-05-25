import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { FileText, FilePen as FilePdf, FileType, FileImage, FileCode, Trash2 } from 'lucide-react-native';
import { Document } from '@/types/document';
import { formatFileSize, formatDate } from '@/utils/formatters';

interface DocumentCardProps {
  document: Document;
  onPress: () => void;
  onDelete: () => void;
}

export default function DocumentCard({ document, onPress, onDelete }: DocumentCardProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const getFileIcon = () => {
    const type = document.type?.toLowerCase() ?? '';
  
    if (type.includes('pdf')) {
      return <FilePdf size={24} color={colors.primary} />;
    } else if (type.includes('image')) {
      return <FileImage size={24} color={colors.secondary} />;
    } else if (type.includes('html') || type.includes('javascript') || type.includes('json')) {
      return <FileCode size={24} color="#F59E0B" />;
    } else if (type.includes('text') || type.includes('word') || type.includes('document')) {
      return <FileText size={24} color="#3B82F6" />;
    } else {
      return <FileType size={24} color={colors.textSecondary} />;
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        {getFileIcon()}
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>{document.title}</Text>
        
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>
            {formatFileSize(document.size)} • {formatDate(document.uploadDate)}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={onDelete}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <Trash2 size={20} color={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  deleteButton: {
    justifyContent: 'center',
    padding: 5,
  },
});