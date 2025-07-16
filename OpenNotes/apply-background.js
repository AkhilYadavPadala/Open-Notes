const fs = require('fs');
const path = require('path');

// List of screens that need the background wrapper applied
const screens = [
  'OpenNotes/app/main/profile.tsx',
  'OpenNotes/app/main/upload.tsx',
  'OpenNotes/app/main/download.tsx',
  'OpenNotes/app/main/pdfViewer.tsx',
  'OpenNotes/app/main/CommentScreen.tsx',
];

console.log('To apply the dark horizon glow background to all screens, you need to:');
console.log('\n1. Import BackgroundWrapper in each screen:');
console.log('   import BackgroundWrapper from \'../utils/BackgroundWrapper\';');
console.log('\n2. Wrap the main return statement with BackgroundWrapper:');
console.log('   return (');
console.log('     <BackgroundWrapper>');
console.log('       {/* existing content */}');
console.log('     </BackgroundWrapper>');
console.log('   );');
console.log('\n3. Update text colors to white/light colors for better visibility');
console.log('\nScreens that need updating:');
screens.forEach(screen => {
  console.log(`- ${screen}`);
});

console.log('\nYou can also update the BottomTabNavigator to have a dark theme by modifying the tabBarStyle.'); 