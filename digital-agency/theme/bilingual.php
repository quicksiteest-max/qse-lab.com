<?php
if(!defined('ABSPATH'))exit;
function form_language(){return str_starts_with(parse_url($_SERVER['REQUEST_URI']??'/',PHP_URL_PATH),'/ru/')?'ru':'en';}
function form_dictionary(){static $dict=null;if($dict===null){$file=get_theme_file_path('english-translations.json');$dict=is_file($file)?json_decode(file_get_contents($file),true):[];}return $dict;}
function form_translate_html($html){
 $dict=form_dictionary();
 $translate=function($value)use($dict){$key=trim(html_entity_decode($value,ENT_QUOTES|ENT_HTML5,'UTF-8'));if(!isset($dict[$key]))return $value;return preg_replace('/\S(?:[\s\S]*\S)?/u',htmlspecialchars($dict[$key],ENT_QUOTES|ENT_HTML5,'UTF-8'),$value,1);};
 $html=preg_replace_callback('~>([^<>]+)<~u',fn($m)=>'>'.$translate($m[1]).'<',$html);
 return preg_replace_callback('~\b(alt|placeholder|aria-label|title)="([^"]*)"~u',fn($m)=>$m[1].'="'.$translate($m[2]).'"',$html);
}
add_action('parse_request',function($wp){$path='/'.trim($wp->request,'/').'/';if($path==='//')$path='/';$map=get_option('form_language_routes',[]);if(isset($map[$path])){$post=get_post($map[$path]);$wp->query_vars=$post->post_type==='page'?['page_id'=>$post->ID]:['p'=>$post->ID,'post_type'=>$post->post_type];}},20);
foreach(['post_link','page_link','post_type_link'] as $filter)add_filter($filter,function($url,$post){$id=is_object($post)?$post->ID:$post;$route=get_post_meta($id,'_form_route',true);return $route?home_url($route):$url;},20,2);
add_filter('redirect_canonical',function($redirect){$path='/'.trim(parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH),'/').'/';if($path==='//')$path='/';return isset(get_option('form_language_routes',[])[$path])?false:$redirect;});
add_filter('query_loop_block_query_vars',function($query){$query['meta_query'][]=['key'=>'_form_language','value'=>form_language()];return $query;});
add_filter('language_attributes',fn($value)=>preg_replace('/lang="[^"]+"/','lang="'.form_language().'"',$value),30);
add_action('template_redirect',function(){if(is_admin())return;ob_start(function($html){
 $lang=form_language();$path=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);$counter=$lang==='ru'?preg_replace('~^/ru/~','/',$path):'/ru/'.ltrim($path,'/');
 if($lang==='en')$html=form_translate_html($html);
 else $html=preg_replace_callback('~href="http://127\.0\.0\.1:8090(/[^"#?]*)"~',fn($m)=>'href="'.home_url(preg_match('~^/wp-~',$m[1])||str_starts_with($m[1],'/ru/')?$m[1]:'/ru/'.ltrim($m[1],'/')).'"',$html);
 $switch='<nav class="language-switch" aria-label="'.($lang==='en'?'Language':'Язык').'"><a href="'.home_url($lang==='en'?$path:$counter).'" lang="en"'.($lang==='en'?' aria-current="page"':'').'>EN</a><span>/</span><a href="'.home_url($lang==='ru'?$path:$counter).'" lang="ru"'.($lang==='ru'?' aria-current="page"':'').'>RU</a></nav>';
 $html=preg_replace('~(<button class="menu-toggle")~',$switch.'$1',$html,1);
 $html=str_replace('content="ru_RU"','content="'.($lang==='ru'?'ru_RU':'en_US').'"',$html);
 return $html;
 });},0);
