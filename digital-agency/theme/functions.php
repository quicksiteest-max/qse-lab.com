<?php
if (!defined('ABSPATH')) exit;
require_once __DIR__.'/bilingual.php';
add_action('after_setup_theme', function () {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('editor-styles');
    add_editor_style('assets/studio.css');
    add_image_size('form-card', 1200, 900, true);
});
add_action('init', function () {
    register_post_type('form_project', [
        'labels'=>['name'=>'Проекты','singular_name'=>'Проект','add_new_item'=>'Добавить проект','edit_item'=>'Редактировать проект'],
        'public'=>true, 'show_in_rest'=>true, 'menu_icon'=>'dashicons-art',
        'supports'=>['title','editor','thumbnail','excerpt','revisions','page-attributes'],
        'rewrite'=>['slug'=>'work','with_front'=>false], 'has_archive'=>false,
    ]);
    register_taxonomy('form_discipline','form_project',[
        'labels'=>['name'=>'Направления','singular_name'=>'Направление'],
        'public'=>true,'rewrite'=>false,'show_ui'=>true,'show_in_rest'=>true,'hierarchical'=>false,
    ]);
    register_post_type('form_service', [
        'labels'=>['name'=>'Услуги','singular_name'=>'Услуга','add_new_item'=>'Добавить услугу','edit_item'=>'Редактировать услугу'],
        'public'=>true,'show_in_rest'=>true,'menu_icon'=>'dashicons-admin-tools',
        'supports'=>['title','editor','thumbnail','excerpt','revisions','page-attributes'],
        'rewrite'=>['slug'=>'services','with_front'=>false], 'has_archive'=>false,
    ]);
    register_block_pattern_category('form-sections',['label'=>'FORM · Секции сайта']);
});
add_action('wp_enqueue_scripts',function () {
    wp_enqueue_style('form-studio',get_theme_file_uri('assets/studio.css'),[],filemtime(get_theme_file_path('assets/studio.css')));
    wp_enqueue_script('form-studio',get_theme_file_uri('assets/studio.js'),[],filemtime(get_theme_file_path('assets/studio.js')),true);
});
// Keep native block CSS local: the exported site has no CDN or font dependencies.
add_filter('should_load_separate_core_block_assets','__return_true');
remove_action('wp_head','print_emoji_detection_script',7);
remove_action('wp_print_styles','print_emoji_styles');
remove_action('wp_head','wp_generator');
remove_action('wp_head','rest_output_link_wp_head');
remove_action('wp_head','wp_oembed_add_discovery_links');
remove_action('wp_head','rsd_link');
remove_action('wp_head','feed_links',2);
remove_action('wp_head','feed_links_extra',3);
add_filter('language_attributes',fn($output)=>preg_replace('/lang="[^"]+"/','lang="ru"',$output));
add_filter('wp_robots',function($robots){$robots['noindex']=true;unset($robots['index']);return $robots;});
add_action('wp_head',function () {
    if(is_404())return;
    $id=get_queried_object_id();
    $description=has_excerpt($id)?get_the_excerpt($id):'FORM — независимая digital-студия. Стратегия, брендинг и цифровой опыт. Демонстрационный проект WordPress от QSE Lab.';
    $url=is_front_page()?home_url('/'):get_permalink($id);
    echo '<meta name="description" content="'.esc_attr(wp_strip_all_tags($description)).'">' . "\n";
    echo '<meta property="og:title" content="'.esc_attr(wp_get_document_title()).'">'."\n";
    echo '<meta property="og:description" content="'.esc_attr(wp_strip_all_tags($description)).'">'."\n";
    echo '<meta property="og:type" content="website"><meta property="og:locale" content="ru_RU">'."\n";
    echo '<meta property="og:url" content="'.esc_url($url).'">'."\n";
    echo '<meta property="og:image" content="'.esc_url(get_theme_file_uri('assets/social-cover.jpg')).'">'."\n";
    echo '<meta name="theme-color" content="#141514">'."\n";
    echo '<link rel="icon" href="'.esc_url(get_theme_file_uri('assets/mark.svg')).'" type="image/svg+xml">'."\n";
    echo '<script type="application/ld+json">'.wp_json_encode(['@context'=>'https://schema.org','@type'=>'WebSite','name'=>'FORM · Digital Agency — QSE Lab demo','url'=>home_url('/'),'inLanguage'=>'ru','description'=>'Демонстрационный проект WordPress. Все проекты и бренды вымышлены.'],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES).'</script>'."\n";
});
add_filter('document_title_separator',fn()=>'·');
add_filter('excerpt_more',fn()=>'');
add_filter('excerpt_length',fn()=>25);
// Native Query blocks automatically reflect edited titles, covers, and newly added items.
add_filter('render_block_core/post-terms',function($html,$block){
    if(($block['attrs']['term']??'')==='form_discipline')$html=preg_replace('/<a\b[^>]*>(.*?)<\/a>/s','<span>$1</span>',$html);
    return $html;
},10,2);
add_filter('render_block_core/navigation',function($html){
    if(str_contains($html,'site-nav'))$html=preg_replace('/<nav /','<nav id="form-site-nav" ',$html,1);
    return $html;
});
