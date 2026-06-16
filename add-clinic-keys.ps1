$en_path = 'public/locales/en/translation.json'
$ar_path = 'public/locales/ar/translation.json'

# Read existing JSON
$en = Get-Content $en_path -Raw | ConvertFrom-Json
$ar = Get-Content $ar_path -Raw | ConvertFrom-Json

# Missing keys
$newKeys = @{
    'pages_DoctorClinicProfile.text_clinic_profile_title' = 'Doctor Clinic Profile'
    'pages_DoctorClinicProfile.text_clinic_profile_subtitle' = 'Manage your clinic information and appearance'
    'pages_DoctorClinicProfile.text_basic_info' = 'Basic Information'
    'pages_DoctorClinicProfile.text_visuals' = 'Visuals'
    'pages_DoctorClinicProfile.text_details' = 'Details'
    'pages_DoctorClinicProfile.text_bio_label' = 'Bio'
    'pages_DoctorClinicProfile.text_specialty_label' = 'Specialty'
    'pages_DoctorClinicProfile.text_profile_picture_label' = 'Profile Picture'
    'pages_DoctorClinicProfile.text_upload_profile_picture' = 'Upload profile picture...'
    'pages_DoctorClinicProfile.text_cover_image_label' = 'Cover Image'
    'pages_DoctorClinicProfile.text_upload_cover_image' = 'Upload cover image...'
    'pages_DoctorClinicProfile.text_add_more_photos' = 'Add More Photos'
    'pages_DoctorClinicProfile.text_no_photos_yet' = 'No Photos Yet'
    'pages_DoctorClinicProfile.text_empty_state_description' = 'Start by adding photos of your clinic'
    'pages_DoctorClinicProfile.text_upload_first_photo' = 'Upload First Photo'
    'pages_DoctorClinicProfile.text_save_changes' = 'Save Changes'
}

# Add to EN
foreach ($key in $newKeys.Keys) {
    $en.translation | Add-Member -NotePropertyName $key -NotePropertyValue $newKeys[$key] -Force
}

# Add to AR (same values for now - they'll need translation)
foreach ($key in $newKeys.Keys) {
    $ar.translation | Add-Member -NotePropertyName $key -NotePropertyValue $newKeys[$key] -Force
}

# Save back
$en | ConvertTo-Json -Depth 10 | Set-Content $en_path
$ar | ConvertTo-Json -Depth 10 | Set-Content $ar_path

Write-Host "Added missing ClinicProfile translation keys to both EN and AR files"
